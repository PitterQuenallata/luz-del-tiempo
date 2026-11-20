import React from 'react';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { LoginCardSection } from '../../../components/ui/login-signup';
import { Toaster } from 'sileo';
import { useTheme } from '../../../shared/context/theme-context';
import { useSession, useSignIn, SESSION_QUERY_KEY } from '../hooks/use-session';
import { useQueryClient } from '@tanstack/react-query';

export const AuthCardFullscreenPage: React.FC = () => {
  const navigate = useNavigate();
  const session = useSession();
  const signIn = useSignIn();
  const qc = useQueryClient();
  const { resolvedTheme } = useTheme();

  // Si ya hay sesión (y no debe cambiar la contraseña), no mostrar el login
  if (session.data && !session.data.mustChangePassword) {
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
        onSuccess={() => navigate({ to: qc.getQueryData<any>(SESSION_QUERY_KEY)?.mustChangePassword ? '/new-password' : '/dashboard' })}
      />
    </div>
  );
};

export default AuthCardFullscreenPage;
