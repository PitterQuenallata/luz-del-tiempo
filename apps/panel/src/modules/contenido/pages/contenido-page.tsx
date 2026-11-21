import React, { useState } from 'react';
import { cn } from '../../../shared/lib/utils';
import { HeroTab } from '../components/hero-tab';
import { AreasTab } from '../components/areas-tab';
import { PersonasTab } from '../components/personas-tab';

type Pestana = 'portada' | 'areas' | 'personas';

const PESTANAS: { id: Pestana; label: string }[] = [
  { id: 'portada', label: 'Portada' },
  { id: 'areas', label: 'Áreas' },
  { id: 'personas', label: 'Personas' },
];

// Pestaña inicial según el hash (#/contenido?tab=areas), igual que en Usuarios.
const pestanaInicial = (): Pestana => {
  const h = window.location.hash;
  if (h.includes('tab=areas')) return 'areas';
  if (h.includes('tab=personas')) return 'personas';
  return 'portada';
};

// Contenido de la web pública: portada, áreas y personas (docs/ESTADO-Y-PLAN.md, etapa 1).
export const ContenidoPage: React.FC = () => {
  const [pestana, setPestana] = useState<Pestana>(pestanaInicial);

  const cambiar = (p: Pestana) => {
    setPestana(p);
    window.location.hash = p === 'portada' ? '#/contenido' : `#/contenido?tab=${p}`;
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Principal / Contenido web</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Contenido web</h1>
        <p className="text-sm text-muted-foreground mt-1">Lo que se ve en la página pública, sin programar.</p>
      </div>

      <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border">
        {PESTANAS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => cambiar(p.id)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors',
              pestana === p.id ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {pestana === 'portada' && <HeroTab />}
      {pestana === 'areas' && <AreasTab />}
      {pestana === 'personas' && <PersonasTab />}
    </div>
  );
};
