import { FondoRadio } from '../../shared/components/brand/fondo-radio';
import { Logo } from '../../shared/components/brand/logo';
"use client";

import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Spinner } from './ios-spinner';
import { pillToast } from '../../shared/components/ui/pill-toast';
import { useSound } from '../../shared/context/sound-context';
import { Button } from '../../shared/components/ui/button';
import { cn } from '../../shared/lib/utils';

export type AuthCardView =
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'reset-password'
  | 'two-factor';

export interface LoginCardSectionProps {
  initialView?: AuthCardView;
  brandName?: string;
  onSuccess?: (view: AuthCardView, data: any) => void;
  onLogin?: (credentials: { email: string; password: string; rememberMe: boolean }) => Promise<void>;
  onNavigateHome?: () => void;
  fullscreen?: boolean;
}

// Brand SVG Icons
const GoogleIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669 C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62 c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401 c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
  </svg>
);

const GithubIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

const AppleIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1.01.08 2.02-.49 2.64-1.24z" />
  </svg>
);

export function LoginCardSection({
  initialView = 'login',
  brandName = 'La Luz del Tiempo',
  onSuccess,
  onLogin,
  onNavigateHome,
  fullscreen = false,
}: LoginCardSectionProps) {
  const { play } = useSound();
  const [view, setView] = useState<AuthCardView>(initialView);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    play('click');
    setIsLoading(true);

    if (view === 'login' && onLogin) {
      try {
        await onLogin({ email, password, rememberMe });
        play('success');
        pillToast.success('Sesión iniciada', 'Bienvenido de nuevo.');
        onSuccess?.('login', { email, rememberMe });
      } catch (err) {
        play('alert');
        pillToast.error('No se pudo iniciar sesión', err instanceof Error ? err.message : 'Inténtalo de nuevo.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setTimeout(() => {
      setIsLoading(false);
      play('success');

      if (view === 'login') {
        pillToast.success('Sesión iniciada', `Bienvenido de nuevo, ${email || 'usuario'}`);
        onSuccess?.('login', { email, rememberMe });
      } else if (view === 'register') {
        pillToast.success('Cuenta creada', 'Tu cuenta ha sido configurada con éxito.');
        onSuccess?.('register', { name, email });
      } else if (view === 'forgot-password') {
        pillToast.info('Correo enviado', 'Revisa tu bandeja con el enlace de recuperación.');
        setView('reset-password');
      } else if (view === 'reset-password') {
        pillToast.success('Contraseña actualizada', 'Ya puedes ingresar con tus nuevas credenciales.');
        setView('login');
      } else if (view === 'two-factor') {
        pillToast.success('Identidad verificada', 'Código 2FA confirmado correctamente.');
        onSuccess?.('two-factor', { otp: otp.join('') });
      }
    }, 900);
  };

  const handleSocialLogin = (provider: 'Google' | 'GitHub' | 'Apple') => {
    play('click');
    pillToast.info(`Conectando con ${provider}`, 'Iniciando autenticación federada segura...');
  };

  return (
    <div
      className={cn(
        'w-full flex flex-col justify-between relative select-none overflow-hidden transition-colors',
        fullscreen
          ? 'min-h-screen bg-[#0b1324] text-[#0b1324] p-4 sm:p-6 md:p-10'
          : 'min-h-[720px] rounded-3xl bg-[#0b1324] text-[#0b1324] p-4 sm:p-6 md:p-8 border border-[#0b1324]/10'
      )}
    >
      {/* Fondo de ondas de radio */}
      <FondoRadio className="z-0" />

      {/* Header Bar */}
      <header className="relative z-10 w-full flex items-center justify-between pb-6">
        <div
          onClick={() => {
            play('tab');
            onNavigateHome?.();
          }}
          className="cursor-pointer font-bold tracking-widest text-sm text-[#0b1324]/90 hover:text-[#0b1324] transition-colors font-mono flex items-center gap-2"
        >
          <span className="h-2 w-2 rounded-full bg-primary" />
          <Logo className="h-8 w-8" />
          <span>{brandName}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            play('click');
            pillToast.info('Mesa de Ayuda La Luz del Tiempo', 'Soporte y documentación oficial disponibles 24/7.');
          }}
          className="rounded-full bg-[#0b1324]/5 border-[#0b1324]/10 hover:bg-[#0b1324]/10 text-xs text-[#0b1324]/80 hover:text-[#0b1324] transition-all cursor-pointer"
        >
          <span>Contacto</span>
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Button>
      </header>

      {/* Center Floating iOS Card */}
      <main className="relative z-10 my-auto flex justify-center items-center py-6">
        <div className="w-full max-w-[420px] rounded-3xl bg-white/95 backdrop-blur-2xl border border-[#0b1324]/10 p-6 sm:p-8 shadow-[0_24px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all">
          
          {/* VIEW: 1. LOGIN */}
          {view === 'login' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex flex-col items-center text-center gap-3">
                <img src="/brand/logo.png" alt="La Luz del Tiempo" draggable={false} className="h-16 w-16 object-contain select-none" />
              </div>
              <div className="space-y-1.5 text-left">
                <h1 className="text-2xl font-bold tracking-tight text-[#0b1324]">
                  Bienvenido de nuevo
                </h1>
                <p className="text-sm text-[#5b6478]">
                  Inicia sesión en tu cuenta
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-[#3f4a63]">
                    Correo
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6478]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#f3f1ea] border border-[#0b1324]/10 text-sm text-[#0b1324] placeholder:text-[#8a92a6] focus:outline-none focus:border-[#0b1324]/30 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-[#3f4a63]">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6478]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#f3f1ea] border border-[#0b1324]/10 text-sm text-[#0b1324] placeholder:text-[#8a92a6] focus:outline-none focus:border-[#0b1324]/30 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5b6478] hover:text-[#3f4a63] transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded-md border-[#0b1324]/20 bg-neutral-900 text-primary accent-primary cursor-pointer"
                    />
                    <span className="text-xs text-[#5b6478]">Recordarme</span>
                  </label>

                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl bg-[#e2a927] text-[#0b1324] font-semibold text-sm hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer shadow-md mt-2 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Spinner size="sm" /> : <span>Iniciar sesión</span>}
                </Button>
              </form>

              {/* Social Login Options */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#0b1324]/10" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-wider">
                  <span className="bg-white px-2 text-[#5b6478]">O</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('GitHub')}
                  className="h-10 rounded-xl bg-[#0b1324]/5 hover:bg-[#0b1324]/10 border border-[#0b1324]/10 text-xs font-medium text-[#3f4a63] hover:text-[#0b1324] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <GithubIcon className="h-4 w-4" />
                  <span>GitHub</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('Google')}
                  className="h-10 rounded-xl bg-[#0b1324]/5 hover:bg-[#0b1324]/10 border border-[#0b1324]/10 text-xs font-medium text-[#3f4a63] hover:text-[#0b1324] flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                >
                  <GoogleIcon className="h-4 w-4" />
                  <span>Google</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW: 2. REGISTER */}
          {view === 'register' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-1.5 text-left">
                <h1 className="text-2xl font-bold tracking-tight text-[#0b1324]">
                  Crear una cuenta
                </h1>
                <p className="text-sm text-[#5b6478]">
                  Únete a La Luz del Tiempo
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-[#3f4a63]">
                    Nombre completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6478]" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nombre completo"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#f3f1ea] border border-[#0b1324]/10 text-sm text-[#0b1324] placeholder:text-[#8a92a6] focus:outline-none focus:border-[#0b1324]/30 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-[#3f4a63]">
                    Correo
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6478]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#f3f1ea] border border-[#0b1324]/10 text-sm text-[#0b1324] placeholder:text-[#8a92a6] focus:outline-none focus:border-[#0b1324]/30 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-[#3f4a63]">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6478]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#f3f1ea] border border-[#0b1324]/10 text-sm text-[#0b1324] placeholder:text-[#8a92a6] focus:outline-none focus:border-[#0b1324]/30 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5b6478] hover:text-[#3f4a63] transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="h-4 w-4 mt-0.5 rounded-md border-[#0b1324]/20 bg-neutral-900 text-primary accent-primary cursor-pointer"
                  />
                  <span className="text-[11px] text-[#5b6478] leading-tight">
                    Acepto los términos de servicio y la política de privacidad
                  </span>
                </label>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl bg-[#e2a927] text-[#0b1324] font-semibold text-sm hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer shadow-md mt-2 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Spinner size="sm" /> : <span>Crear cuenta</span>}
                </Button>
              </form>

              <div className="pt-1 text-center text-xs text-[#5b6478]">
                <span>¿Ya tienes cuenta? </span>
                <button
                  type="button"
                  onClick={() => {
                    play('tab');
                    setView('login');
                  }}
                  className="text-[#0b1324] font-medium hover:underline cursor-pointer"
                >
                  Iniciar sesión
                </button>
              </div>
            </div>
          )}

          {/* VIEW: 3. FORGOT PASSWORD */}
          {view === 'forgot-password' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-1.5 text-left">
                <h1 className="text-2xl font-bold tracking-tight text-[#0b1324]">
                  Restablecer contraseña
                </h1>
                <p className="text-sm text-[#5b6478]">
                  Escribe tu correo para recibir las instrucciones.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-[#3f4a63]">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6478]" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#f3f1ea] border border-[#0b1324]/10 text-sm text-[#0b1324] placeholder:text-[#8a92a6] focus:outline-none focus:border-[#0b1324]/30 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl bg-[#e2a927] text-[#0b1324] font-semibold text-sm hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer shadow-md mt-2 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Spinner size="sm" /> : <span>Enviar enlace de recuperación</span>}
                </Button>
              </form>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    play('tab');
                    setView('login');
                  }}
                  className="text-xs text-[#5b6478] hover:text-[#0b1324] flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Volver al inicio de sesión</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW: 4. RESET PASSWORD */}
          {view === 'reset-password' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-1.5 text-left">
                <h1 className="text-2xl font-bold tracking-tight text-[#0b1324]">
                  Set new password
                </h1>
                <p className="text-sm text-[#5b6478]">
                  Choose a secure password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-[#3f4a63]">
                    Nueva contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6478]" />
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#f3f1ea] border border-[#0b1324]/10 text-sm text-[#0b1324] placeholder:text-[#8a92a6] focus:outline-none focus:border-[#0b1324]/30 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-medium text-[#3f4a63]">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5b6478]" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#f3f1ea] border border-[#0b1324]/10 text-sm text-[#0b1324] placeholder:text-[#8a92a6] focus:outline-none focus:border-[#0b1324]/30 focus:ring-1 focus:ring-white/20 transition-all"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl bg-[#e2a927] text-[#0b1324] font-semibold text-sm hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer shadow-md mt-2 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Spinner size="sm" /> : <span>Actualizar contraseña</span>}
                </Button>
              </form>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    play('tab');
                    setView('login');
                  }}
                  className="text-xs text-[#5b6478] hover:text-[#0b1324] flex items-center justify-center gap-1 mx-auto transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Volver al inicio de sesión</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW: 5. TWO-FACTOR AUTH (2FA) */}
          {view === 'two-factor' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-1.5 text-left">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-2">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#0b1324]">
                  Two-factor auth
                </h1>
                <p className="text-sm text-[#5b6478]">
                  Enter the 6-digit code sent to your authenticator app.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex justify-between gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-input-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-12 h-13 rounded-xl bg-[#f3f1ea] border border-[#0b1324]/10 text-center font-mono font-bold text-lg text-[#0b1324] focus:outline-none focus:border-[#0b1324]/30 focus:ring-1 focus:ring-white/20 transition-all tabular-nums"
                    />
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || otp.some((d) => !d)}
                  className="w-full h-11 rounded-xl bg-[#e2a927] text-[#0b1324] font-semibold text-sm hover:bg-neutral-200 active:scale-[0.98] transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  {isLoading ? <Spinner size="sm" /> : <span>Verificar código</span>}
                </Button>
              </form>

              <div className="flex items-center justify-between text-xs text-[#5b6478] pt-1">
                <button
                  type="button"
                  onClick={() => {
                    play('pop');
                    pillToast.info('Código reenviado', 'Se ha enviado un nuevo código SMS o push.');
                  }}
                  className="hover:text-[#0b1324] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Reenviar código</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    play('tab');
                    setView('login');
                  }}
                  className="hover:text-[#0b1324] transition-colors cursor-pointer"
                >
                  Back to login
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer System Status */}
      <footer className="relative z-10 w-full flex items-center justify-between pt-6 text-[11px] text-[#5b6478] font-mono border-t border-[#0b1324]/5">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sistemas en línea</span>
        </div>
        <span>Conexión cifrada (TLS)</span>
      </footer>
    </div>
  );
}

export default LoginCardSection;
