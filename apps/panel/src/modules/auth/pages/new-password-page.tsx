import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { luzApi, ApiRequestError } from '../../../shared/api/luz-api';
import { SESSION_QUERY_KEY, useSession } from '../hooks/use-session';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { Input } from '../../../shared/components/ui/input';
import { Logo } from '../../../shared/components/brand/logo';
import { errorContrasena } from '../../../shared/lib/validaciones';

// Campo de contraseña. Definido fuera de la página para que no pierda el foco al escribir.
interface CampoProps {
  id: string;
  label: string;
  value: string;
  onChange: (valor: string) => void;
  error?: string | null;
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
}

const CampoContrasena: React.FC<CampoProps> = ({ id, label, value, onChange, error, visible, onToggle, autoComplete }) => (
  <div className="space-y-1.5">
    <label htmlFor={id} className="text-xs font-medium text-[#dbe3f3]">{label}</label>
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 pr-10 text-sm"
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a9b7d2] hover:text-[#dbe3f3] cursor-pointer"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
    {error && <p className="text-[11px] text-red-400">{error}</p>}
  </div>
);

// Primer ingreso: la contraseña inicial debe cambiarse antes de usar el panel.
export const NewPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: yo } = useSession();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [mostrar, setMostrar] = useState({ actual: false, nueva: false, repetir: false });
  const [intentado, setIntentado] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const errActual = actual ? null : 'Escribe tu contraseña inicial.';
  const errNueva = errorContrasena(nueva, actual);
  const errRepetir = repetir && repetir !== nueva ? 'Las contraseñas no coinciden.' : null;
  const valido = !errActual && !errNueva && !errRepetir && repetir.length > 0;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    setErrorServidor(null);
    if (!valido) return;
    setGuardando(true);
    try {
      await luzApi.changePassword(actual, nueva);
      await qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      pillToast.success('Contraseña actualizada', 'Ya puedes usar el panel.');
      navigate({ to: '/dashboard' });
    } catch (err) {
      setErrorServidor(err instanceof ApiRequestError ? err.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setGuardando(false);
    }
  };

  const alternar = (campo: 'actual' | 'nueva' | 'repetir') => setMostrar((m) => ({ ...m, [campo]: !m[campo] }));

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0b1324] flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(226,169,39,0.16),transparent_70%)]" />
      <div className="relative w-full max-w-[400px]">
        <form
          onSubmit={guardar}
          noValidate
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

          <CampoContrasena
            id="np-actual"
            label="Contraseña inicial"
            value={actual}
            onChange={setActual}
            error={intentado || actual ? errActual : null}
            visible={mostrar.actual}
            onToggle={() => alternar('actual')}
            autoComplete="current-password"
          />
          <CampoContrasena
            id="np-nueva"
            label="Nueva contraseña"
            value={nueva}
            onChange={setNueva}
            error={intentado || nueva ? errNueva : null}
            visible={mostrar.nueva}
            onToggle={() => alternar('nueva')}
            autoComplete="new-password"
          />
          <CampoContrasena
            id="np-repetir"
            label="Repetir nueva contraseña"
            value={repetir}
            onChange={setRepetir}
            error={intentado || repetir ? errRepetir : null}
            visible={mostrar.repetir}
            onToggle={() => alternar('repetir')}
            autoComplete="new-password"
          />

          {errorServidor && (
            <p role="alert" className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{errorServidor}</p>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="w-full h-11 rounded-xl bg-[#e2a927] text-[#0b1324] font-semibold text-sm hover:bg-[#f0c35a] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {guardando ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
          <p className="text-[11px] text-center text-[#a9b7d2]">Mínimo 8 caracteres. Distinta de la inicial.</p>
        </form>
      </div>
    </div>
  );
};

export default NewPasswordPage;
