import React from 'react';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { LoginForm } from '../components/login-form';
import { useSession, useSignIn } from '../hooks/use-session';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const session = useSession();
  const signIn = useSignIn();

  if (session.data) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0b1324] flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(226,169,39,0.16),transparent_70%)]" />

      <div className="relative w-full max-w-[400px]">
        <div className="rounded-3xl border border-white/10 bg-[#0f1b38]/90 p-6 sm:p-8 shadow-[0_24px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          <LoginForm
            onSubmit={async ({ email, password, rememberMe }) => {
              await signIn.mutateAsync({ email, password, rememberMe });
              navigate({ to: '/dashboard' });
            }}
          />
        </div>
        <p className="mt-6 text-center text-[11px] text-[#a9b7d2]">Acceso solo para el equipo del ministerio</p>
      </div>
    </div>
  );
};

export default LoginPage;
