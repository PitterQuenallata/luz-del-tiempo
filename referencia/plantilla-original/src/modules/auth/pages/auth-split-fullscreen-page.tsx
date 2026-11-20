import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { AuthPage } from '../../../components/ui/auth-page';

export const AuthSplitFullscreenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-[#070709]">
      <AuthPage
        fullscreen={true}
        brandName="Blakor Asme"
        onNavigateHome={() => navigate({ to: '/dashboard' })}
        onSuccess={() => navigate({ to: '/dashboard' })}
      />
    </div>
  );
};

export default AuthSplitFullscreenPage;
