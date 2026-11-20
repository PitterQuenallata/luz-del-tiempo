import React from 'react';
import { AppQueryProvider } from './query-provider';
import { ThemeProvider } from '../../shared/context/theme-context';
import { SoundProvider } from '../../shared/context/sound-context';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AppQueryProvider>
      <ThemeProvider>
        <SoundProvider>
          {children}
        </SoundProvider>
      </ThemeProvider>
    </AppQueryProvider>
  );
};
