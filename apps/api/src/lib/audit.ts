import { db } from '../db/index.js';
import { auditLog } from '../db/schema.js';

export interface EventoAuditoria {
  userId: string | null;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  detalle?: string | null;
  cambios?: Record<string, unknown> | null;
}

// Registra una acción en la bitácora. Nunca debe romper la acción principal.
export async function registrarAuditoria(evento: EventoAuditoria) {
  try {
    await db.insert(auditLog).values({
      userId: evento.userId,
      accion: evento.accion,
      entidad: evento.entidad,
      entidadId: evento.entidadId ?? null,
      detalle: evento.detalle ?? null,
      cambios: evento.cambios ?? null,
    });
  } catch (err) {
    console.error('[auditoria] no se pudo registrar', evento.accion, err);
  }
}
