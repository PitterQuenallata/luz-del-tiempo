import React from 'react';
import { Navigate, useNavigate } from '@tanstack/react-router';
import { LoginCardSection } from '../../../components/ui/login-signup';
import { useSession, useSignIn } from '../hooks/use-session';

export const AuthCardFullscreenPage: React.FC = () => {
  const navigate = useNavigate();
  const session = useSession();
  const signIn = useSignIn();

  // Si ya hay sesión, no mostrar el login
  if (session.data) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="w-full min-h-screen bg-[#0b1324]">
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
