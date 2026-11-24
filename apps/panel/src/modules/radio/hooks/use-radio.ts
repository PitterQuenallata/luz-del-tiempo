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

// Quién transmite con el emisor de Windows (se refresca solo)
export const useEnVivoEmisor = () =>
  useQuery({ queryKey: ['gestion', 'radio', 'en-vivo'], queryFn: () => luzApi.getEnVivoEmisor(), refetchInterval: 15_000 });

export const useLocutores = (emisoraId: string | null) =>
  useQuery({
    queryKey: ['gestion', 'radio', 'locutores', emisoraId ?? ''],
    queryFn: () => luzApi.getLocutores(emisoraId as string),
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
