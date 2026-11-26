import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ListOrdered, Pause, Play, Shuffle, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { ApiPista, luzApi } from '../../../shared/api/luz-api';
import { cn } from '../../../shared/lib/utils';

// Reproductor de UNA lista de reproducción, para escucharla desde el panel antes de que suene en la radio.
// Modo «En orden» (como sonará) o «Aleatorio». Solo suena en este equipo; no toca la radio.

function mezclar<T>(lista: T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export const ReproductorLista: React.FC<{ trackIds: string[]; pistas: ApiPista[] }> = ({ trackIds, pistas }) => {
  const porId = useMemo(() => new Map(pistas.map((p) => [p.id, p])), [pistas]);
  const validas = useMemo(() => trackIds.filter((id) => porId.has(id)), [trackIds, porId]);
  const [modo, setModo] = useState<'orden' | 'aleatorio'>('orden');
  const [cola, setCola] = useState<string[]>(validas);
  const [indice, setIndice] = useState(0);
  const [sonando, setSonando] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  // Si la lista cambia (se vinculan o quitan pistas), la cola vuelve a empezar
  useEffect(() => {
    setCola(modo === 'aleatorio' ? mezclar(validas) : validas);
    setIndice(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validas.join('|'), modo]);

  const actual = cola[indice] ? porId.get(cola[indice]) : undefined;

  // Cambia el audio cuando cambia la pista; si estaba sonando, sigue sonando
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (!actual) {
      a.removeAttribute('src');
      a.load();
      return;
    }
    a.src = luzApi.urlAudioPista(actual.id);
    if (sonando) void a.play().catch(() => setSonando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actual?.id]);

  const siguiente = () => {
    if (cola.length === 0) return;
    setIndice((i) => (i + 1) % cola.length);
  };
  const anterior = () => {
    if (cola.length === 0) return;
    const a = audio.current;
    // Como en un reproductor: si ya lleva un rato, vuelve al inicio de la pista; si no, a la anterior
    if (a && a.currentTime > 3) { a.currentTime = 0; return; }
    setIndice((i) => (i - 1 + cola.length) % cola.length);
  };

  const alternar = async () => {
    const a = audio.current;
    if (!a || !actual) return;
    if (sonando) {
      a.pause();
      setSonando(false);
      return;
    }
    try {
      if (!a.src) a.src = luzApi.urlAudioPista(actual.id);
      await a.play();
      setSonando(true);
    } catch {
      setSonando(false);
    }
  };

  const cambiarModo = (nuevo: 'orden' | 'aleatorio') => {
    if (nuevo === modo) return;
    setModo(nuevo);
  };

  if (validas.length === 0) {
    return <p className="text-xs text-muted-foreground">Esta lista no tiene audios para escuchar.</p>;
  }

  return (
    <div className="space-y-3">
      <audio
        ref={audio}
        preload="none"
        onEnded={siguiente}
        onPause={() => setSonando(false)}
        onPlay={() => setSonando(true)}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Anterior" onClick={anterior} disabled={cola.length === 0}>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button type="button" size="icon" aria-label={sonando ? 'Pausar' : 'Reproducir'} onClick={alternar} disabled={!actual}>
          {sonando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Siguiente" onClick={siguiente} disabled={cola.length === 0}>
          <SkipForward className="h-4 w-4" />
        </Button>
        <div className="ml-1 flex overflow-hidden rounded-lg border border-border text-[11px]">
          <button type="button" onClick={() => cambiarModo('orden')} aria-pressed={modo === 'orden'} className={cn('flex items-center gap-1 px-2.5 py-1.5 cursor-pointer', modo === 'orden' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
            <ListOrdered className="h-3.5 w-3.5" /> En orden
          </button>
          <button type="button" onClick={() => cambiarModo('aleatorio')} aria-pressed={modo === 'aleatorio'} className={cn('flex items-center gap-1 border-l border-border px-2.5 py-1.5 cursor-pointer', modo === 'aleatorio' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>
            <Shuffle className="h-3.5 w-3.5" /> Aleatorio
          </button>
        </div>
      </div>
      <p className="truncate text-xs">
        <span className="text-muted-foreground">{actual ? `${indice + 1} de ${cola.length} · ` : ''}</span>
        <span className="font-medium">{actual ? (actual.title || actual.storageKey) : 'Sin audio'}</span>
        {actual?.artist && <span className="text-muted-foreground"> · {actual.artist}</span>}
      </p>
    </div>
  );
};
