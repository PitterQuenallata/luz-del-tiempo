import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../shared/lib/utils';

// Selector nativo con la flecha centrada y con espacio a la derecha (estilo de la plantilla).
export const SelectField = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement> & { wrapperClassName?: string }>(
  ({ className, wrapperClassName, children, ...props }, ref) => (
    <div className={cn('relative', wrapperClassName ?? 'w-full')}>
      <select
        ref={ref}
        {...props}
        className={cn(
          'h-9 w-full appearance-none rounded-xl border border-border bg-background pl-3 pr-9 text-xs font-medium text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
          className
        )}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
);
SelectField.displayName = 'SelectField';
