import React from 'react';
import { useParams } from '@tanstack/react-router';
import { Card, CardContent } from '../../../shared/components/ui/card';
import { ModoEdicion } from '../../contenido/components/dialogo-contenido';
import { irA } from '../lib/navegar';
import { useArea, useHero, usePersonas, useAreas } from '../../contenido/hooks/use-contenido';
import { useActividades, useEmisoras, useNoticias, useProgramas, useSeries, useVideos } from '../hooks/use-gestion';
import { HeroDialog } from '../../contenido/components/hero-dialog';
import { AreaDialog } from '../../contenido/components/area-dialog';
import { PersonaDialog } from '../../contenido/components/persona-dialog';
import { NoticiaDialog } from '../../noticias/components/noticia-dialog';
import { ActividadEditorPage } from '../../actividades/pages/actividad-editor-page';
import { VideoDialog } from '../../videos/components/video-dialog';
import { SerieDialog } from '../../videos/components/serie-dialog';
import { EmisoraDialog } from '../../radio/components/emisora-dialog';
import { ProgramaDialog } from '../../radio/components/programa-dialog';

// Cada edición tiene su propia página (no ventana emergente). Se abre desde la lista con su enlace.
// Las páginas de edición leen su registro de la misma caché que la lista.

const Pagina: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ModoEdicion.Provider value="pagina">
    <div className="space-y-6 pb-16">
      <div className="mx-auto w-full max-w-3xl">{children}</div>
    </div>
  </ModoEdicion.Provider>
);

const Cargando = () => <p className="p-4 text-xs text-muted-foreground">Cargando…</p>;

const NoEncontrado: React.FC<{ volver: string }> = ({ volver }) => (
  <Card className="mx-auto w-full max-w-3xl border-border">
    <CardContent className="p-6 text-xs space-y-3">
      <p>Este elemento ya no existe.</p>
      <button type="button" className="text-primary underline cursor-pointer" onClick={() => irA(volver)}>Volver a la lista</button>
    </CardContent>
  </Card>
);

// Las rutas de alta (/noticias/nueva, /videos/nuevo…) no traen parámetro: se tratan como 'nueva'
const useIdRuta = () => {
  const p = useParams({ strict: false }) as { id?: string; programaId?: string };
  return { id: p.id ?? 'nueva', programaId: p.programaId ?? 'nuevo' };
};

// Hace que un formulario se monte de nuevo al cambiar de registro (evita valores viejos)
const Entre = ({ children, clave }: { children: React.ReactNode; clave: string }) => <React.Fragment key={clave}>{children}</React.Fragment>;

export const HeroEdicionPage = () => {
  const { id = '' } = useIdRuta();
  const { data, isLoading } = useHero();
  if (id !== 'nueva' && isLoading) return <Cargando />;
  const lista = data ?? [];
  const slide = id === 'nueva' ? null : lista.find((s) => s.id === id) ?? null;
  if (id !== 'nueva' && !slide) return <NoEncontrado volver="/contenido" />;
  const siguiente = lista.length ? Math.max(...lista.map((s) => s.sortOrder)) + 1 : 0;
  return (
    <Pagina>
      <Entre clave={id}>
        <HeroDialog slide={slide} siguienteOrden={siguiente} onClose={() => irA('/contenido')} />
      </Entre>
    </Pagina>
  );
};

export const AreaEdicionPage = () => {
  const { id = '' } = useIdRuta();
  const area = useArea(id === 'nueva' ? null : id);
  const areas = useAreas();
  if (id !== 'nueva' && area.isLoading) return <Cargando />;
  if (id !== 'nueva' && !area.data) return <NoEncontrado volver="/contenido?tab=areas" />;
  const siguiente = (areas.data ?? []).length ? Math.max(...(areas.data ?? []).map((a) => a.sortOrder)) + 1 : 0;
  return (
    <Pagina>
      <Entre clave={id}>
        <AreaDialog area={id === 'nueva' ? null : area.data ?? null} siguienteOrden={siguiente} onClose={() => irA('/contenido?tab=areas')} />
      </Entre>
    </Pagina>
  );
};

export const PersonaEdicionPage = () => {
  const { id = '' } = useIdRuta();
  const { data, isLoading } = usePersonas();
  if (id !== 'nueva' && isLoading) return <Cargando />;
  const lista = data ?? [];
  const persona = id === 'nueva' ? null : lista.find((p) => p.id === id) ?? null;
  if (id !== 'nueva' && !persona) return <NoEncontrado volver="/contenido?tab=personas" />;
  const siguiente = lista.length ? Math.max(...lista.map((p) => p.sortOrder)) + 1 : 0;
  return (
    <Pagina>
      <Entre clave={id}>
        <PersonaDialog persona={persona} siguienteOrden={siguiente} onClose={() => irA('/contenido?tab=personas')} />
      </Entre>
    </Pagina>
  );
};

export const NoticiaEdicionPage = () => {
  const { id = '' } = useIdRuta();
  const { data, isLoading } = useNoticias();
  if (id !== 'nueva' && isLoading) return <Cargando />;
  const noticia = id === 'nueva' ? null : (data ?? []).find((n) => n.id === id) ?? null;
  if (id !== 'nueva' && !noticia) return <NoEncontrado volver="/noticias" />;
  return (
    <Pagina>
      <Entre clave={id}>
        <NoticiaDialog noticia={noticia} onClose={() => irA('/noticias')} />
      </Entre>
    </Pagina>
  );
};

export const ActividadEdicionPage = () => {
  const { id = '' } = useIdRuta();
  return (
    <Pagina>
      <Entre clave={id}>
        <ActividadEditorPage id={id === 'nueva' ? null : id} />
      </Entre>
    </Pagina>
  );
};

export const VideoEdicionPage = () => {
  const { id = '' } = useIdRuta();
  const { data, isLoading } = useVideos();
  if (id !== 'nueva' && isLoading) return <Cargando />;
  const video = id === 'nueva' ? null : (data ?? []).find((v) => v.id === id) ?? null;
  if (id !== 'nueva' && !video) return <NoEncontrado volver="/videos" />;
  return (
    <Pagina>
      <Entre clave={id}>
        <VideoDialog video={video} onClose={() => irA('/videos')} />
      </Entre>
    </Pagina>
  );
};

export const SerieEdicionPage = () => {
  const { id = '' } = useIdRuta();
  const { data, isLoading } = useSeries();
  if (id !== 'nueva' && isLoading) return <Cargando />;
  const serie = id === 'nueva' ? null : (data ?? []).find((s) => s.id === id) ?? null;
  if (id !== 'nueva' && !serie) return <NoEncontrado volver="/videos" />;
  return (
    <Pagina>
      <Entre clave={id}>
        <SerieDialog serie={serie} onClose={() => irA('/videos')} />
      </Entre>
    </Pagina>
  );
};

export const EmisoraEdicionPage = () => {
  const { id = '' } = useIdRuta();
  const { data, isLoading } = useEmisoras();
  if (id !== 'nueva' && isLoading) return <Cargando />;
  const emisora = id === 'nueva' ? null : (data ?? []).find((e) => e.id === id) ?? null;
  if (id !== 'nueva' && !emisora) return <NoEncontrado volver="/emisoras" />;
  return (
    <Pagina>
      <Entre clave={id}>
        <EmisoraDialog emisora={emisora} onClose={() => irA('/emisoras')} />
      </Entre>
    </Pagina>
  );
};

export const ProgramaEdicionPage = () => {
  const { id = '', programaId = 'nuevo' } = useIdRuta();
  const { data, isLoading } = useProgramas(id);
  if (programaId !== 'nuevo' && isLoading) return <Cargando />;
  const programa = programaId === 'nuevo' ? null : (data ?? []).find((p) => p.id === programaId) ?? null;
  if (programaId !== 'nuevo' && !programa) return <NoEncontrado volver="/emisoras" />;
  return (
    <Pagina>
      <Entre clave={programaId}>
        <ProgramaDialog emisoraId={id} programa={programa} onClose={() => irA('/emisoras')} />
      </Entre>
    </Pagina>
  );
};
