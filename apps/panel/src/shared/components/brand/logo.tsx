import React from 'react';
import { cn } from '../../lib/utils';

// Logo oficial de La Luz del Tiempo (copia de apps/web/public/brand/logo.png).
export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src="/brand/logo.png"
    alt="La Luz del Tiempo"
    draggable={false}
    className={cn('h-8 w-8 object-contain select-none', className)}
  />
);
