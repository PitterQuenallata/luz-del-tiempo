import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '../../../shared/components/brand/logo';
import { Input } from '../../../shared/components/ui/input';

export interface LoginValues {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface LoginFormProps {
  onSubmit: (values: LoginValues) => Promise<void>;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({ email: email.trim(), password, rememberMe });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col items-center text-center gap-3">
        <Logo className="h-16 w-16" />
        <div>
          <h1 className="font-heading text-xl font-semibold tracking-tight text-[#dbe3f3]">Bienvenido de nuevo</h1>
          <p className="text-xs text-[#a9b7d2] mt-1">Inicia sesión en el panel del ministerio</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-email" className="text-xs font-medium text-[#dbe3f3]">
          Correo
        </label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="h-11 text-sm font-mono"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="login-password" className="text-xs font-medium text-[#dbe3f3]">
          Contraseña
        </label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11 text-sm pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a9b7d2] hover:text-[#dbe3f3] cursor-pointer"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-xs text-[#a9b7d2] cursor-pointer select-none">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="h-3.5 w-3.5 accent-[#e2a927]"
        />
        Recordarme en este equipo
      </label>

      {error && (
        <p role="alert" className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl bg-[#e2a927] text-[#0b1324] font-semibold text-sm hover:bg-[#f0c35a] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? 'Entrando…' : 'Iniciar sesión'}
      </button>
    </form>
  );
};
