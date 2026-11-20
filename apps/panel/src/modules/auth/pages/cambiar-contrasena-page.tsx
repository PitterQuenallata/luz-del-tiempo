import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { luzApi, ApiRequestError } from '../../../shared/api/luz-api';
import { SESSION_QUERY_KEY, useSession } from '../hooks/use-session';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { Toaster } from 'sileo';
import { useTheme } from '../../../shared/context/theme-context';
import { Logo } from '../../../shared/components/brand/logo';
import { errorContrasena } from '../../../shared/lib/validaciones';

// Primer inicio: la contraseña inicial debe cambiarse antes de usar el panel.
export const CambiarContrasenaPage: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: yo } = useSession();
  const { resolvedTheme } = useTheme();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [intentado, setIntentado] = useState(false);
  const [error, setError] = useState<{ campo?: string; mensaje: string } | null>(null);
  const [guardando, setGuardando] = useState(false);

  const errActual = actual ? null : 'Escribe tu contraseña actual.';
  const errNueva = errorContrasena(nueva, actual);
  const errRepetir = repetir && repetir !== nueva ? 'Las contraseñas no coinciden.' : null;
  const valido = !errActual && !errNueva && !errRepetir && repetir.length > 0;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    setError(null);
    if (!valido) return;
    setGuardando(true);
    try {
      await luzApi.changePassword(actual, nueva);
      await qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      pillToast.success('Contraseña actualizada', 'Ya puedes usar el panel.');
      navigate({ to: '/dashboard' });
    } catch (err) {
      const mensaje = err instanceof ApiRequestError ? err.message : 'No se pudo cambiar la contraseña.';
      setError({ campo: (err as any)?.campo, mensaje });
    } finally {
      setGuardando(false);
    }
  };

  const Campo: React.FC<{ id: string; label: string; value: string; onChange: (v: string) => void; error?: string | null }> = ({ id, label, value, onChange, error: e }) => (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-medium text-[#dbe3f3]">{label}</label>
      <input
        id={id}
        type="password"
        autoComplete={id === 'cc-nueva' || id === 'cc-repetir' ? 'new-password' : 'current-password'}
        value={value}
        onChange={(ev) => onChange(ev.target.value)}
        className="w-full h-11 rounded-xl border border-white/10 bg-[#070d1a] px-3 text-sm text-[#dbe3f3] focus:outline-none focus:ring-1 focus:ring-[#e2a927]"
      />
      {(intentado || value) && e && <p className="text-[11px] text-red-400">{e}</p>}
    </div>
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0b1324] flex items-center justify-center p-4">
      <Toaster position="top-center" theme={resolvedTheme} options={{ duration: 3500 }} />
      <div className="relative w-full max-w-[420px] rounded-3xl border border-white/10 bg-[#0f1b38]/90 p-6 sm:p-8 shadow-[0_24px_50px_rgba(0,0,0,0.5)]">
        <form onSubmit={guardar} noValidate className="space-y-5">
          <div className="flex flex-col items-center text-center gap-3">
            <Logo className="h-14 w-14" />
            <div>
              <h1 className="text-xl font-semibold text-[#dbe3f3]">Cambia tu contraseña</h1>
              <p className="text-xs text-[#a9b7d2] mt-1">
                {yo?.firstName ? `${yo.firstName}, ` : ''}es tu primer ingreso. Elige una contraseña nueva para usar el panel.
              </p>
            </div>
          </div>

          <Campo id="cc-actual" label="Contraseña inicial" value={actual} onChange={setActual} error={errActual} />
          <Campo id="cc-nueva" label="Nueva contraseña" value={nueva} onChange={setNueva} error={errNueva} />
          <Campo id="cc-repetir" label="Repetir nueva contraseña" value={repetir} onChange={setRepetir} error={errRepetir} />

          {error && (
            <p role="alert" className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{error.mensaje}</p>
          )}

          <button
            type="submit"
            disabled={guardando || (intentado && !valido)}
            className="w-full h-11 rounded-xl bg-[#e2a927] text-[#0b1324] font-semibold text-sm hover:bg-[#f0c35a] disabled:opacity-60 cursor-pointer"
          >
            {guardando ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CambiarContrasenaPage;
