import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { luzApi } from '../../../shared/api/luz-api';
import { pillToast } from '../../../shared/components/ui/pill-toast';

// Todas las claves empiezan con 'gestion' para invalidarlas juntas.
const mensaje = (err: unknown) => (err instanceof Error ? err.message : 'Inténtalo de nuevo.');

export const useListaGestion = <T,>(clave: string, fn: () => Promise<T>) =>
  useQuery({ queryKey: ['gestion', clave], queryFn: fn });

export function useMutacionGestion<TIn, TOut = unknown>(fn: (input: TIn) => Promise<TOut>, ok: string, error: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gestion'] });
      pillToast.success(ok);
    },
    onError: (err) => pillToast.error(error, mensaje(err)),
  });
}

export const useNoticias = () => useListaGestion('noticias', () => luzApi.listNoticias());
export const useActividades = () => useListaGestion('actividades', () => luzApi.listActividades());
export const useSeries = () => useListaGestion('series', () => luzApi.listSeries());
export const useVideos = () => useListaGestion('videos', () => luzApi.listVideos());
export const useEnVivo = () => useQuery({ queryKey: ['gestion', 'en-vivo'], queryFn: () => luzApi.getEnVivo() });
export const useEmisoras = () => useListaGestion('emisoras', () => luzApi.listEmisoras());
export const useProgramas = (emisoraId: string | null) =>
  useQuery({
    queryKey: ['gestion', 'programas', emisoraId ?? ''],
    queryFn: () => luzApi.listProgramas(emisoraId as string),
    enabled: Boolean(emisoraId),
  });
export const useDonaciones = () => useListaGestion('donaciones', () => luzApi.getDonaciones());
