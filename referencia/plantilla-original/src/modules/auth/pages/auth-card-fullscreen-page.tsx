import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { LoginCardSection } from '../../../components/ui/login-signup';

export const AuthCardFullscreenPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen bg-[#0A0A0C]">
      <LoginCardSection
        fullscreen={true}
        brandName="BLAKOR DALI"
        onNavigateHome={() => navigate({ to: '/dashboard' })}
        onSuccess={() => navigate({ to: '/dashboard' })}
      />
    </div>
  );
};

export default AuthCardFullscreenPage;
