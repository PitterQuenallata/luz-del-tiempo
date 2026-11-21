import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { luzApi } from '../../../shared/api/luz-api';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import type { HeroInput, AreaInput, PersonaInput } from '@luz/shared';

// Todas las claves empiezan con 'contenido' para invalidarlas juntas.
export const HERO_KEY = ['contenido', 'hero'] as const;
export const AREAS_KEY = ['contenido', 'areas'] as const;
export const PERSONAS_KEY = ['contenido', 'personas'] as const;
export const areaKey = (id: string) => ['contenido', 'area', id] as const;

const mensaje = (err: unknown) => (err instanceof Error ? err.message : 'Inténtalo de nuevo.');

export const useHero = () => useQuery({ queryKey: HERO_KEY, queryFn: () => luzApi.listHero() });
export const useAreas = () => useQuery({ queryKey: AREAS_KEY, queryFn: () => luzApi.listAreas() });
export const usePersonas = () => useQuery({ queryKey: PERSONAS_KEY, queryFn: () => luzApi.listPersonas() });
export const useArea = (id: string | null) =>
  useQuery({ queryKey: areaKey(id ?? ''), queryFn: () => luzApi.getArea(id as string), enabled: Boolean(id) });

// Mutación genérica: invalida el contenido y avisa con una píldora.
function useMutacion<TIn, TOut>(
  fn: (input: TIn) => Promise<TOut>,
  ok: string,
  error: string,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contenido'] });
      pillToast.success(ok);
    },
    onError: (err) => pillToast.error(error, mensaje(err)),
  });
}

export const useGuardarHero = (id: string | null) =>
  useMutacion(
    (datos: Partial<HeroInput>) => (id ? luzApi.updateHero(id, datos) : luzApi.createHero(datos as HeroInput)),
    id ? 'Diapositiva guardada' : 'Diapositiva creada',
    'No se pudo guardar la diapositiva',
  );

export const useEliminarHero = () =>
  useMutacion((id: string) => luzApi.deleteHero(id), 'Diapositiva eliminada', 'No se pudo eliminar');

export const useGuardarArea = (id: string | null) =>
  useMutacion(
    (datos: Partial<AreaInput>) => (id ? luzApi.updateArea(id, datos) : luzApi.createArea(datos as AreaInput)),
    id ? 'Área guardada' : 'Área creada',
    'No se pudo guardar el área',
  );

export const useEliminarArea = () =>
  useMutacion((id: string) => luzApi.deleteArea(id), 'Área eliminada', 'No se pudo eliminar el área');

export const useAgregarFotoGaleria = () =>
  useMutacion(
    ({ areaId, url, caption }: { areaId: string; url: string; caption?: string | null }) =>
      luzApi.addFotoGaleria(areaId, url, caption),
    'Foto agregada a la galería',
    'No se pudo agregar la foto',
  );

export const useQuitarFotoGaleria = () =>
  useMutacion(
    ({ areaId, fotoId }: { areaId: string; fotoId: string }) => luzApi.deleteFotoGaleria(areaId, fotoId),
    'Foto quitada de la galería',
    'No se pudo quitar la foto',
  );

export const useGuardarPersona = (id: string | null) =>
  useMutacion(
    (datos: Partial<PersonaInput>) => (id ? luzApi.updatePersona(id, datos) : luzApi.createPersona(datos as PersonaInput)),
    id ? 'Persona guardada' : 'Persona creada',
    'No se pudo guardar la persona',
  );

export const useEliminarPersona = () =>
  useMutacion((id: string) => luzApi.deletePersona(id), 'Persona eliminada', 'No se pudo eliminar');
