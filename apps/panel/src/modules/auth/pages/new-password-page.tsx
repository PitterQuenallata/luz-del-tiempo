import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Eye, EyeOff } from 'lucide-react';
import { cambioContrasenaSchema } from '@luz/shared';
import { luzApi, ApiRequestError } from '../../../shared/api/luz-api';
import { SESSION_QUERY_KEY, useSession } from '../hooks/use-session';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { Input } from '../../../shared/components/ui/input';
import { Logo } from '../../../shared/components/brand/logo';
import { mensajeCampo } from '../../../shared/lib/form';

// Campo de contraseña con botón para mostrar u ocultar. Definido fuera de la página.
interface CampoProps {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  onBlur: () => void;
  error: string | null;
  autoComplete: string;
}

const CampoContrasena: React.FC<CampoProps> = ({ id, label, value, onChange, onBlur, error, autoComplete }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-[#dbe3f3]">{label}</label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className="h-11 pr-10 text-sm"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a9b7d2] hover:text-[#dbe3f3] cursor-pointer"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
};

// Primer ingreso: la contraseña inicial debe cambiarse antes de usar el panel.
export const NewPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: yo } = useSession();
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { actual: '', nueva: '', repetir: '' },
    validators: { onChange: cambioContrasenaSchema, onSubmit: cambioContrasenaSchema },
    onSubmit: async ({ value }) => {
      setErrorServidor(null);
      try {
        await luzApi.changePassword(value.actual, value.nueva);
        await qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
        pillToast.success('Contraseña actualizada', 'Ya puedes usar el panel.');
        navigate({ to: '/dashboard' });
      } catch (err) {
        setErrorServidor(err instanceof ApiRequestError ? err.message : 'No se pudo cambiar la contraseña.');
      }
    },
  });

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0b1324] flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(226,169,39,0.16),transparent_70%)]" />
      <div className="relative w-full max-w-[400px]">
        <form
          noValidate
          onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); form.handleSubmit(); }}
          className="rounded-3xl border border-white/10 bg-[#0f1b38]/90 p-6 sm:p-8 shadow-[0_24px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl space-y-5"
        >
          <div className="flex flex-col items-center text-center gap-3">
            <Logo className="h-16 w-16" />
            <div>
              <h1 className="font-heading text-xl font-semibold tracking-tight text-[#dbe3f3]">Crea tu nueva contraseña</h1>
              <p className="text-xs text-[#a9b7d2] mt-1">
                {yo?.firstName ? `${yo.firstName}, es` : 'Es'} tu primer ingreso. Cambia la contraseña inicial para usar el panel.
              </p>
            </div>
          </div>

          <form.Field name="actual">
            {(f) => (
              <CampoContrasena id="np-actual" label="Contraseña inicial" value={f.state.value} onChange={f.handleChange} onBlur={f.handleBlur}
                error={f.state.meta.isTouched ? mensajeCampo(f.state.meta.errors) : null} autoComplete="current-password" />
            )}
          </form.Field>
          <form.Field name="nueva">
            {(f) => (
              <CampoContrasena id="np-nueva" label="Nueva contraseña" value={f.state.value} onChange={f.handleChange} onBlur={f.handleBlur}
                error={f.state.meta.isTouched ? mensajeCampo(f.state.meta.errors) : null} autoComplete="new-password" />
            )}
          </form.Field>
          <form.Field name="repetir">
            {(f) => (
              <CampoContrasena id="np-repetir" label="Repetir nueva contraseña" value={f.state.value} onChange={f.handleChange} onBlur={f.handleBlur}
                error={f.state.meta.isTouched ? mensajeCampo(f.state.meta.errors) : null} autoComplete="new-password" />
            )}
          </form.Field>

          {errorServidor && (
            <p role="alert" className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{errorServidor}</p>
          )}

          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
            {([puedeEnviar, enviando]) => (
              <button
                type="submit"
                disabled={!puedeEnviar || enviando}
                className="w-full h-11 rounded-xl bg-[#e2a927] text-[#0b1324] font-semibold text-sm hover:bg-[#f0c35a] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {enviando ? 'Guardando…' : 'Cambiar contraseña'}
              </button>
            )}
          </form.Subscribe>
          <p className="text-[11px] text-center text-[#a9b7d2]">Mínimo 8 caracteres. Distinta de la inicial.</p>
        </form>
      </div>
    </div>
  );
};

export default NewPasswordPage;
