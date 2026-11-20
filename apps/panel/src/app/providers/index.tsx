import React from 'react';
import { ConfirmHost } from '../../shared/components/ui/confirm-host';
import { AppQueryProvider } from './query-provider';
import { ThemeProvider } from '../../shared/context/theme-context';
import { SoundProvider } from '../../shared/context/sound-context';
import { LayoutProvider } from '../../shared/context/layout-context';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppQueryProvider>
      <ThemeProvider>
        <SoundProvider>
          <LayoutProvider>
            {children}
            <ConfirmHost />
          </LayoutProvider>
        </SoundProvider>
      </ThemeProvider>
    </AppQueryProvider>
  );
};
