import React from 'react';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { LoginCardSection } from '../../../components/ui/login-signup';
import { Toaster } from 'sileo';
import { useTheme } from '../../../shared/context/theme-context';
import { useSession, useSignIn } from '../hooks/use-session';

export const AuthCardFullscreenPage: React.FC = () => {
  const navigate = useNavigate();
  const session = useSession();
  const signIn = useSignIn();
  const { resolvedTheme } = useTheme();

  // Si ya hay sesión, no mostrar el login
  if (session.data) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="w-full min-h-screen bg-[#0b1324]">
      {/* Página independiente (sin shell): aquí también debe mostrarse el aviso de error */}
      <Toaster position="top-center" theme={resolvedTheme} options={{ duration: 3500 }} />
      <LoginCardSection
        fullscreen={true}
        brandName="La Luz del Tiempo"
        onLogin={async ({ email, password }) => {
          await signIn.mutateAsync({ email, password });
        }}
        onSuccess={() => navigate({ to: '/dashboard' })}
      />
    </div>
  );
};

export default AuthCardFullscreenPage;
