import React from 'react';
import { cn } from '../../lib/utils';

// Fondo de ondas de radio: círculos concéntricos desde un "transmisor" dorado en el centro.
export const FondoRadio: React.FC<{ className?: string }> = ({ className }) => (
  <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden bg-[#f7f5ef]', className)}>
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,rgba(226,169,39,0.14),transparent_70%)]" />
    <svg className="absolute left-1/2 top-[45%] h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2 text-[#0b1324]" viewBox="0 0 1000 1000" fill="none">
      {[90, 170, 250, 330, 410, 490, 570].map((r, i) => (
        <circle key={r} cx="500" cy="500" r={r} stroke="currentColor" strokeOpacity={0.09 - i * 0.009} strokeWidth="1.2" />
      ))}
      <path d="M 140 500 A 360 360 0 0 1 500 140" stroke="#e2a927" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
      <path d="M 860 500 A 360 360 0 0 1 500 860" stroke="#e2a927" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
      <circle cx="500" cy="500" r="6" fill="#e2a927" />
    </svg>
  </div>
);
