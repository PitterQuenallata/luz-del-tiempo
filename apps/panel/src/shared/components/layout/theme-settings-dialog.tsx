import React, { useState } from 'react';
import { X, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../context/theme-context';
import { ACCENTS, AccentId, ContainerWidth, getAccent, getContainer, saveAccent, saveContainer } from '../../lib/appearance';
import { cn } from '../../lib/utils';

interface ThemeSettingsDialogProps {
  onClose: () => void;
  onContainerChange: (value: ContainerWidth) => void;
}

// Configuración de tema: modo, color de acento y ancho del contenido.
export const ThemeSettingsDialog: React.FC<ThemeSettingsDialogProps> = ({ onClose, onContainerChange }) => {
  const { theme, setTheme } = useTheme();
  const [accent, setAccent] = useState<AccentId>(getAccent);
  const [container, setContainer] = useState<ContainerWidth>(getContainer);

  const modos = [
    { id: 'light' as const, label: 'Claro', icon: Sun },
    { id: 'dark' as const, label: 'Oscuro', icon: Moon },
    { id: 'system' as const, label: 'Sistema', icon: Monitor },
  ];

  const anchos: { id: ContainerWidth; label: string }[] = [
    { id: 'fluid', label: 'Ancho completo' },
    { id: 'boxed', label: 'Centrado (1440px)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Configuración de tema"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-xl"
      >
        <div className="flex items-center justify-between p-5 border-b border-border/60">
          <h3 className="text-sm font-semibold">Configuración de tema</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-muted-foreground hover:text-foreground cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-6 text-xs">
          <section className="space-y-2">
            <p className="font-medium">Modo de color</p>
            <div className="grid grid-cols-3 gap-2">
              {modos.map((m) => {
                const Icon = m.icon;
                const activo = theme === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTheme(m.id)}
                    className={cn(
                      'h-16 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors',
                      activo ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <p className="font-medium">Color de acento</p>
            <div className="grid grid-cols-4 gap-2">
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  title={a.label}
                  aria-label={a.label}
                  onClick={() => {
                    setAccent(a.id);
                    saveAccent(a.id);
                  }}
                  className={cn(
                    'h-10 rounded-xl border-2 cursor-pointer',
                    accent === a.id ? 'border-foreground' : 'border-transparent'
                  )}
                  style={{ backgroundColor: a.color }}
                />
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">{ACCENTS.find((a) => a.id === accent)?.label}</p>
          </section>

          <section className="space-y-2">
            <p className="font-medium">Ancho del contenido</p>
            <div className="grid grid-cols-2 gap-2">
              {anchos.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setContainer(w.id);
                    saveContainer(w.id);
                    onContainerChange(w.id);
                  }}
                  className={cn(
                    'h-9 rounded-xl border cursor-pointer',
                    container === w.id ? 'border-primary bg-primary/10' : 'border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
