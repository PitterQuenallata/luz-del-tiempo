import { useQuery } from '@tanstack/react-query';
import { luzApi } from '../../../shared/api/luz-api';

// Claves bajo 'gestion' para que useMutacionGestion las invalide al guardar.
export const useServicioRadio = () =>
  useQuery({ queryKey: ['gestion', 'radio', 'servicio'], queryFn: () => luzApi.getServicioRadio(), refetchInterval: 30_000 });

export const useTransmision = (emisoraId: string | null) =>
  useQuery({
    queryKey: ['gestion', 'radio', 'transmision', emisoraId ?? ''],
    queryFn: () => luzApi.getTransmision(emisoraId as string),
    enabled: Boolean(emisoraId),
  });

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
