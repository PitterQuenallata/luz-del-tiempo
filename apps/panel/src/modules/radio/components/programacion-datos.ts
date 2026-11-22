import { useQuery } from '@tanstack/react-query';
import { luzApi } from '../../../shared/api/luz-api';

export { type ApiEmisora } from '../../../shared/api/luz-api';

// Programas de una emisora con sus horarios (misma consulta que la pestaña de programación)
export const useProgramasTodos = (emisoraId: string | null) =>
  useQuery({
    queryKey: ['gestion', 'programas', emisoraId ?? ''],
    queryFn: () => luzApi.listProgramas(emisoraId as string),
    enabled: Boolean(emisoraId),
  });
