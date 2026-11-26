import { useQuery } from '@tanstack/react-query';
import { luzApi } from '../../../shared/api/luz-api';

// Claves bajo 'gestion' para que useMutacionGestion las invalide al guardar.
export const useServicioRadio = () =>
  useQuery({ queryKey: ['gestion', 'radio', 'servicio'], queryFn: () => luzApi.getServicioRadio(), refetchInterval: 30_000 });

// `refrescarMs`: si la pantalla muestra lo que suena ahora, se actualiza sola (p. ej. cada 5 s)
export const useTransmision = (emisoraId: string | null, refrescarMs?: number) =>
  useQuery({
    queryKey: ['gestion', 'radio', 'transmision', emisoraId ?? ''],
    queryFn: () => luzApi.getTransmision(emisoraId as string),
    enabled: Boolean(emisoraId),
    refetchInterval: refrescarMs,
  });

// Quién transmite con el emisor de Windows (se refresca solo)
export const useEnVivoEmisor = () =>
  useQuery({ queryKey: ['gestion', 'radio', 'en-vivo'], queryFn: () => luzApi.getEnVivoEmisor(), refetchInterval: 15_000 });

export const useLocutores = (emisoraId: string | null) =>
  useQuery({
    queryKey: ['gestion', 'radio', 'locutores', emisoraId ?? ''],
    queryFn: () => luzApi.getLocutores(emisoraId as string),
    enabled: Boolean(emisoraId),
  });

export const useReporteTransmisiones = (mes: string) =>
  useQuery({ queryKey: ['gestion', 'radio', 'reporte', mes], queryFn: () => luzApi.getReporteTransmisiones(mes) });

export const useVersionesEmisor = () =>
  useQuery({ queryKey: ['gestion', 'radio', 'versiones-emisor'], queryFn: () => luzApi.getVersionesEmisor() });

export const usePistas = (emisoraId: string | null) =>
  useQuery({
    queryKey: ['gestion', 'radio', 'pistas', emisoraId ?? ''],
    queryFn: () => luzApi.listPistas(emisoraId as string),
    enabled: Boolean(emisoraId),
  });

export const usePlaylists = (emisoraId: string | null) =>
  useQuery({
    queryKey: ['gestion', 'radio', 'playlists', emisoraId ?? ''],
    queryFn: () => luzApi.listPlaylists(emisoraId as string),
    enabled: Boolean(emisoraId),
  });

// Lo que suena ahora: se refresca cada 5 segundos
export const useAhoraSuena = (estacionId: string | null) =>
  useQuery({
    queryKey: ['gestion', 'radio', 'ahora', estacionId ?? ''],
    queryFn: () => luzApi.getAhoraSuena(estacionId as string),
    enabled: Boolean(estacionId),
    refetchInterval: 5000,
  });
