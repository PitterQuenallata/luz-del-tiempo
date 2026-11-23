import React, { useEffect, useState } from "react";
import { Plus, Trash2, Printer, Download } from 'lucide-react';
import { actividadSchema, AGENDA_CANAL_ETIQUETA, AGENDA_ESTADOS, AGENDA_ROL_ETIQUETA, AGENDA_ROLES, AGENDA_TIPO_ETIQUETA, AGENDA_TIPOS, INSCRIPCION_ESTADOS, PAISES, PAIS_PREDETERMINADO } from '@luz/shared';
import type { ActividadInput, AgendaCanal } from '@luz/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiActividad, ApiInscrito, luzApi } from '../../../shared/api/luz-api';
import { useMutacionGestion, useActividad, useInscritos, useSedes } from '../../gestion/hooks/use-gestion';
import { aInputFecha, desdeInputFecha, fechaLegible } from '../../gestion/lib/fechas';
import { useAreas, usePersonas } from '../../contenido/hooks/use-contenido';
import { EtiquetaCampo, claseTextarea, ErrorCampo } from '../../contenido/components/dialogo-contenido';
import { ImagenCampo } from '../../contenido/components/imagen-campo';
import { slugDe } from '../../contenido/components/area-dialog';
import { irA } from '../../gestion/lib/navegar';
import { cn } from '../../../shared/lib/utils';

// ---------- Forma del formulario (texto tal como lo escribe la persona) ----------

type Bloque = { key: string; startTime: string; durationMin: string; title: string; description: string; personId: string };
type Sesion = { key: string; startsAt: string; endsAt: string; locationId: string; locationNote: string; programa: Bloque[] };
type Persona = { key: string; personId: string; role: (typeof AGENDA_ROLES)[number] };
type Canal = { channel: AgendaCanal; enabled: boolean; value: string };
type Foto = { key: string; imageUrl: string; caption: string };

interface Borrador {
  title: string; slug: string; kind: (typeof AGENDA_TIPOS)[number]; areaIds: string[];
  summary: string; content: string; coverUrl: string | null; report: string;
  language: 'es' | 'en' | 'pt'; isVirtual: boolean; isFree: boolean; priceAmount: string; priceNote: string; capacity: string;
  status: (typeof AGENDA_ESTADOS)[number];
  sesiones: Sesion[]; personas: Persona[]; canales: Canal[]; galeria: Foto[];
  qrUrl: string | null;
}

const clave = () => crypto.randomUUID();
const CANALES: AgendaCanal[] = ['web', 'app', 'whatsapp', 'correo', 'enlace'];
const bloqueVacio = (): Bloque => ({ key: clave(), startTime: '', durationMin: '', title: '', description: '', personId: '' });
const sesionVacia = (): Sesion => ({ key: clave(), startsAt: '', endsAt: '', locationId: '', locationNote: '', programa: [] });

function borradorInicial(a: ApiActividad | null): Borrador {
  if (!a) {
    return {
      title: '', slug: '', kind: 'evento', areaIds: [], summary: '', content: '', coverUrl: null, report: '',
      language: 'es', isVirtual: false, isFree: true, priceAmount: '', priceNote: '', capacity: '', status: 'borrador',
      sesiones: [sesionVacia()], personas: [], qrUrl: null,
      canales: CANALES.map((channel) => ({ channel, enabled: channel === 'web', value: '' })),
      galeria: [],
    };
  }
  return {
    title: a.title, slug: a.slug, kind: a.kind as Borrador['kind'], areaIds: a.areaIds,
    summary: a.summary ?? '', content: a.content ?? '', coverUrl: a.coverUrl, report: a.report ?? '',
    language: a.language, isVirtual: a.isVirtual, isFree: a.isFree, priceAmount: a.priceAmount ? String(a.priceAmount) : '',
    priceNote: a.priceNote ?? '', capacity: a.capacity ? String(a.capacity) : '', status: a.status,
    sesiones: a.sesiones.map((s) => ({
      key: s.id, startsAt: aInputFecha(s.startsAt), endsAt: aInputFecha(s.endsAt), locationId: s.locationId ?? '', locationNote: s.locationNote ?? '',
      programa: s.programa.map((p) => ({
        key: clave(), startTime: p.startTime ?? '', durationMin: p.durationMin ? String(p.durationMin) : '', title: p.title,
        description: p.description ?? '', personId: p.personId ?? '',
      })),
    })),
    personas: a.personas.map((p) => ({ key: clave(), personId: p.personId, role: p.role as Persona['role'] })),
    canales: CANALES.map((channel) => {
      const existente = a.canales.find((c) => c.channel === channel);
      return { channel, enabled: existente?.enabled ?? channel === 'web', value: existente?.value ?? '' };
    }),
    galeria: a.galeria.map((g) => ({ key: clave(), imageUrl: g.imageUrl, caption: g.caption })),
    qrUrl: a.qrUrl,
  };
}

// Convierte el formulario en el cuerpo que espera la API (y lo valida con el mismo esquema)
function armarPayload(b: Borrador): { ok: true; data: ActividadInput } | { ok: false; error: string } {
  const cuerpo = {
    slug: b.slug,
    title: b.title.trim(),
    kind: b.kind,
    areaIds: b.areaIds,
    summary: b.summary.trim() || null,
    content: b.content.trim() || null,
    coverUrl: b.coverUrl,
    report: b.report.trim() || null,
    language: b.language,
    isVirtual: b.isVirtual,
    isFree: b.isFree,
    priceAmount: b.isFree ? null : b.priceAmount ? Number(b.priceAmount) : null,
    priceNote: b.priceNote.trim() || null,
    capacity: b.capacity ? Number(b.capacity) : null,
    qrUrl: b.qrUrl,
    status: b.status,
    sesiones: b.sesiones.map((s) => ({
      startsAt: desdeInputFecha(s.startsAt) ?? '',
      endsAt: desdeInputFecha(s.endsAt),
      locationId: s.locationId || null,
      locationNote: s.locationNote.trim() || null,
      programa: s.programa.map((p) => ({
        startTime: p.startTime || null,
        durationMin: p.durationMin ? Number(p.durationMin) : null,
        title: p.title.trim(),
        description: p.description.trim() || null,
        personId: p.personId || null,
      })),
    })),
    personas: b.personas.filter((p) => p.personId).map((p) => ({ personId: p.personId, role: p.role })),
    canales: b.canales.map((c) => ({ channel: c.channel, value: c.channel === 'web' || c.channel === 'app' ? null : c.value.trim() || null, enabled: c.enabled })),
    galeria: b.galeria.filter((g) => g.imageUrl).map((g) => ({ imageUrl: g.imageUrl, caption: g.caption.trim() || null })),
  };
  const r = actividadSchema.safeParse(cuerpo);
  if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? 'Revisa los datos.' };
  return { ok: true, data: r.data };
}

const selectorTexto = 'text-xs';

// ---------- Página ----------

export const ActividadEditorPage: React.FC<{ id: string | null }> = ({ id }) => {
  const consulta = useActividad(id);
  const areas = useAreas();
  const personas = usePersonas();
  const sedes = useSedes();
  const [b, setB] = useState<Borrador | null>(id ? null : borradorInicial(null));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id && consulta.data && !b) setB(borradorInicial(consulta.data));
  }, [id, consulta.data, b]);

  const guardar = useMutacionGestion(
    (datos: ActividadInput) => (id ? luzApi.updateActividad(id, datos) : luzApi.createActividad(datos)),
    id ? 'Agenda: actividad guardada' : 'Agenda: actividad creada',
    'No se pudo guardar la actividad',
  );

  if (id && consulta.isLoading) return <p className="p-4 text-xs text-muted-foreground">Cargando…</p>;
  if (id && (consulta.error || !consulta.data)) {
    return (
      <Card className="border-border"><CardContent className="p-6 text-xs space-y-3">
        <p>Esta actividad ya no existe.</p>
        <button type="button" className="text-primary underline cursor-pointer" onClick={() => irA('/agenda')}>Volver a la agenda</button>
      </CardContent></Card>
    );
  }
  if (!b) return <p className="p-4 text-xs text-muted-foreground">Cargando…</p>;

  const set = <K extends keyof Borrador>(campo: K, valor: Borrador[K]) => setB((prev) => (prev ? { ...prev, [campo]: valor } : prev));
  const actualizar = (fn: (prev: Borrador) => Borrador) => setB((prev) => (prev ? fn(prev) : prev));

  const guardarTodo = async () => {
    const r = armarPayload(b);
    if (!r.ok) {
      setError(r.error);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError(null);
    await guardar.mutateAsync(r.data);
    irA('/agenda');
  };

  return (
    <form
      noValidate
      className="space-y-5 text-xs"
      onSubmit={(e) => {
        e.preventDefault();
        void guardarTodo();
      }}
    >
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Sitio web / Agenda</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">{id ? b.title || 'Actividad' : 'Nueva actividad'}</h1>
      </div>
      {error && <p className="text-[11px] text-red-400">{error}</p>}

      {/* 1. Datos */}
      <Seccion titulo="Datos" descripcion="Qué es y de qué trata.">
        <ImagenCampo etiqueta="Imagen (afiche)" valor={b.coverUrl} onChange={(url) => set('coverUrl', url)} ratio={3 / 4} etiquetaRatio="3:4" maxAncho={1200} recomendacion="Vertical (3:4). Se recorta sola para que se vea igual en la agenda." />
        <Campo id="act-titulo" etiqueta="Nombre">
          <Input id="act-titulo" value={b.title} onChange={(e) => {
            const titulo = e.target.value;
            setB((prev) => (prev ? { ...prev, title: titulo, slug: id ? prev.slug : slugDe(titulo) } : prev));
          }} placeholder="Campaña de profecía en Oruro" className="text-xs" />
        </Campo>
        <div className="grid gap-4 sm:grid-cols-3">
          <Campo id="act-tipo" etiqueta="Tipo">
            <SelectField id="act-tipo" value={b.kind} onChange={(e) => set('kind', e.target.value as Borrador['kind'])} className={selectorTexto}>
              {AGENDA_TIPOS.map((t) => <option key={t} value={t}>{AGENDA_TIPO_ETIQUETA[t]}</option>)}
            </SelectField>
          </Campo>
          <Campo id="act-idioma" etiqueta="Idioma">
            <SelectField id="act-idioma" value={b.language} onChange={(e) => set('language', e.target.value as Borrador['language'])} className={selectorTexto}>
              <option value="es">Español</option><option value="en">Inglés</option><option value="pt">Portugués</option>
            </SelectField>
          </Campo>
          <Campo id="act-estado" etiqueta="Estado">
            <SelectField id="act-estado" value={b.status} onChange={(e) => set('status', e.target.value as Borrador['status'])} className={selectorTexto}>
              <option value="borrador">Borrador (no se ve)</option><option value="publicada">Publicada</option><option value="cancelada">Cancelada</option>
            </SelectField>
          </Campo>
        </div>
        <div>
          <EtiquetaCampo htmlFor="act-areas">Áreas (el tema)</EtiquetaCampo>
          <div id="act-areas" className="flex flex-wrap gap-2">
            {(areas.data ?? []).map((a) => {
              const activa = b.areaIds.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => set('areaIds', activa ? b.areaIds.filter((x) => x !== a.id) : [...b.areaIds, a.id])}
                  className={cn('rounded-full border px-3 py-1 text-[11px] cursor-pointer', activa ? 'border-primary bg-primary/15 font-semibold' : 'border-border text-muted-foreground hover:text-foreground')}
                >
                  {a.name}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <EtiquetaCampo htmlFor="act-resumen">Resumen (una o dos líneas)</EtiquetaCampo>
          <Input id="act-resumen" value={b.summary} onChange={(e) => set('summary', e.target.value)} maxLength={300} className="text-xs" />
        </div>
        <div>
          <EtiquetaCampo htmlFor="act-descripcion">Descripción</EtiquetaCampo>
          <textarea id="act-descripcion" rows={5} value={b.content} onChange={(e) => set('content', e.target.value)} className={claseTextarea} />
        </div>
        <Switch id="act-virtual" checked={b.isVirtual} onCheckedChange={(v) => set('isVirtual', v)} />
        <p className="text-[11px] text-muted-foreground -mt-2">Virtual: se hace en línea (radio, Zoom, YouTube).</p>
      </Seccion>

      {/* 2. Fechas, sedes y programa */}
      <Seccion titulo="Fechas, lugar y programa" descripcion="Cada día o encuentro es una sesión. Dentro de cada sesión va el programa.">
        <SedesRapidas sedes={sedes.data ?? []} />
        {b.sesiones.map((s, i) => (
          <div key={s.key} className="rounded-xl border border-border/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Sesión {i + 1}</p>
              {b.sesiones.length > 1 && (
                <Button type="button" variant="ghost" size="sm" aria-label="Quitar sesión" onClick={() => actualizar((p) => ({ ...p, sesiones: p.sesiones.filter((x) => x.key !== s.key) }))}>
                  <Trash2 className="h-3.5 w-3.5 text-red-400" />
                </Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo id={`s-ini-${s.key}`} etiqueta="Inicio">
                <Input id={`s-ini-${s.key}`} type="datetime-local" value={s.startsAt} onChange={(e) => cambiarSesion(s.key, { startsAt: e.target.value })} className="text-xs" />
              </Campo>
              <Campo id={`s-fin-${s.key}`} etiqueta="Fin (opcional)">
                <Input id={`s-fin-${s.key}`} type="datetime-local" value={s.endsAt} onChange={(e) => cambiarSesion(s.key, { endsAt: e.target.value })} className="text-xs" />
              </Campo>
              <Campo id={`s-sede-${s.key}`} etiqueta="Sede">
                <SelectField id={`s-sede-${s.key}`} value={s.locationId} onChange={(e) => cambiarSesion(s.key, { locationId: e.target.value })} className={selectorTexto}>
                  <option value="">Sin sede fija</option>
                  {(sedes.data ?? []).map((sd) => <option key={sd.id} value={sd.id}>{sd.name}</option>)}
                </SelectField>
              </Campo>
              <Campo id={`s-nota-${s.key}`} etiqueta="Dónde exactamente (opcional)">
                <Input id={`s-nota-${s.key}`} value={s.locationNote} onChange={(e) => cambiarSesion(s.key, { locationNote: e.target.value })} placeholder="Salón 2, patio…" className="text-xs" />
              </Campo>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Programa de esta sesión</p>
              {s.programa.length === 0 && <p className="text-[11px] text-muted-foreground">Sin bloques todavía.</p>}
              {s.programa.map((p) => (
                <div key={p.key} className="grid gap-2 sm:grid-cols-[90px_80px_1fr_1fr_auto] items-start">
                  <Input type="time" aria-label="Hora" value={p.startTime} onChange={(e) => cambiarBloque(s.key, p.key, { startTime: e.target.value })} className="text-xs" />
                  <Input type="number" min={1} aria-label="Minutos" placeholder="min" value={p.durationMin} onChange={(e) => cambiarBloque(s.key, p.key, { durationMin: e.target.value })} className="text-xs" />
                  <Input aria-label="Título del bloque" placeholder="Mensaje, bienvenida, música…" value={p.title} onChange={(e) => cambiarBloque(s.key, p.key, { title: e.target.value })} className="text-xs" />
                  <SelectField aria-label="Quién presenta" value={p.personId} onChange={(e) => cambiarBloque(s.key, p.key, { personId: e.target.value })} className={selectorTexto}>
                    <option value="">Sin persona</option>
                    {(personas.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </SelectField>
                  <Button type="button" variant="ghost" size="sm" aria-label="Quitar bloque" onClick={() => actualizarSesion(s.key, (ss) => ({ ...ss, programa: ss.programa.filter((x) => x.key !== p.key) }))}>
                    <Trash2 className="h-3.5 w-3.5 text-red-400" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => actualizarSesion(s.key, (ss) => ({ ...ss, programa: [...ss.programa, bloqueVacio()] }))}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />Agregar bloque
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => actualizar((p) => ({ ...p, sesiones: [...p.sesiones, sesionVacia()] }))}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Agregar sesión (otro día)
        </Button>
      </Seccion>

      {/* 3. Personas */}
      <Seccion titulo="Personas" descripcion="Predicadores, invitados, traductores, música. Puede haber tantas como necesites.">
        {b.personas.map((p) => (
          <div key={p.key} className="grid gap-2 sm:grid-cols-[1fr_200px_auto] items-center">
            <SelectField aria-label="Persona" value={p.personId} onChange={(e) => actualizar((x) => ({ ...x, personas: x.personas.map((y) => (y.key === p.key ? { ...y, personId: e.target.value } : y)) }))} className={selectorTexto}>
              <option value="">Elige una persona</option>
              {(personas.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </SelectField>
            <SelectField aria-label="Rol" value={p.role} onChange={(e) => actualizar((x) => ({ ...x, personas: x.personas.map((y) => (y.key === p.key ? { ...y, role: e.target.value as Persona['role'] } : y)) }))} className={selectorTexto}>
              {AGENDA_ROLES.map((r) => <option key={r} value={r}>{AGENDA_ROL_ETIQUETA[r]}</option>)}
            </SelectField>
            <Button type="button" variant="ghost" size="sm" aria-label="Quitar persona" onClick={() => actualizar((x) => ({ ...x, personas: x.personas.filter((y) => y.key !== p.key) }))}>
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => actualizar((x) => ({ ...x, personas: [...x.personas, { key: clave(), personId: '', role: 'predicador' }] }))}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Agregar persona
        </Button>
        {(personas.data ?? []).length === 0 && <p className="text-[11px] text-muted-foreground">Primero agrega personas en Sitio web / Equipo.</p>}
      </Seccion>

      {/* 4. Inscripción y precio */}
      <Seccion titulo="Inscripción y precio" descripcion="Cómo se apuntan. Puedes activar más de un canal.">
        <div className="flex items-center gap-3">
          <Switch id="act-gratis" checked={b.isFree} onCheckedChange={(v) => set('isFree', v)} />
          <EtiquetaCampo htmlFor="act-gratis">Es gratis</EtiquetaCampo>
        </div>
        {!b.isFree && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="act-precio" etiqueta="Precio (Bs)">
              <Input id="act-precio" type="number" min={1} value={b.priceAmount} onChange={(e) => set('priceAmount', e.target.value)} className="text-xs" />
            </Campo>
            <Campo id="act-precio-nota" etiqueta="Detalle del precio (opcional)">
              <Input id="act-precio-nota" value={b.priceNote} onChange={(e) => set('priceNote', e.target.value)} placeholder="Incluye materiales" className="text-xs" />
            </Campo>
          </div>
        )}
        <Campo id="act-cupo" etiqueta="Cupo máximo (vacío = sin límite)">
          <Input id="act-cupo" type="number" min={1} value={b.capacity} onChange={(e) => set('capacity', e.target.value)} className="text-xs sm:w-40" />
        </Campo>

        <div className="space-y-2">
          {b.canales.map((c) => (
            <div key={c.channel} className="grid gap-2 sm:grid-cols-[220px_1fr] items-center">
              <label className="flex items-center gap-3">
                <Switch id={`canal-${c.channel}`} checked={c.enabled} onCheckedChange={(v) => actualizar((x) => ({ ...x, canales: x.canales.map((y) => (y.channel === c.channel ? { ...y, enabled: v } : y)) }))} />
                <span>{AGENDA_CANAL_ETIQUETA[c.channel]}</span>
              </label>
              {c.channel !== 'web' && c.channel !== 'app' && (
                <Input aria-label={`Dato de ${AGENDA_CANAL_ETIQUETA[c.channel]}`} disabled={!c.enabled} value={c.value} onChange={(e) => actualizar((x) => ({ ...x, canales: x.canales.map((y) => (y.channel === c.channel ? { ...y, value: e.target.value } : y)) }))}
                  placeholder={c.channel === 'whatsapp' ? '+591 70000000' : c.channel === 'correo' ? 'correo@ejemplo.com' : 'https://…'} className="text-xs" />
              )}
            </div>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">Cada forma de inscripción se activa aparte: formulario en la web, formulario en la app, WhatsApp, correo o enlace. Puedes tener varias a la vez. Lo que llega por formulario aparece en Inscritos.</p>
        <div className="grid gap-4 sm:grid-cols-2 items-start">
          <div className="space-y-2">
            <p className="font-medium">QR de inscripción (se genera solo)</p>
            {id && b.canales.find((c) => c.channel === "web")?.enabled ? (
              <img src={`/api/v1/public/agenda/${b.slug}/qr.png`} alt="QR de inscripción" className="h-40 w-40 rounded-lg border border-border bg-white p-2" />
            ) : (
              <p className="text-[11px] text-muted-foreground">Se muestra cuando la actividad está guardada y tiene el formulario en la web activado.</p>
            )}
            <p className="text-[11px] text-muted-foreground">Lleva a la inscripción de la ficha en la web y en la app.</p>
          </div>
          <ImagenCampo etiqueta="QR de pago (opcional)" valor={b.qrUrl} onChange={(url) => set("qrUrl", url)} ratio={1} etiquetaRatio="1:1" maxAncho={800} recomendacion="Sube el QR del banco o de la billetera. Aparece junto al QR de inscripción." />
        </div>
      </Seccion>

      {/* 5. Crónica y galería */}
      <Seccion titulo="Crónica y fotos" descripcion="Lo que se hizo, con fotos. Se llena después de la actividad.">
        <div>
          <EtiquetaCampo htmlFor="act-cronica">Crónica</EtiquetaCampo>
          <textarea id="act-cronica" rows={6} value={b.report} onChange={(e) => set('report', e.target.value)} className={claseTextarea} placeholder="Cómo fue, cuántas personas, qué se compartió…" />
        </div>
        {b.galeria.map((f) => (
          <div key={f.key} className="grid gap-3 sm:grid-cols-[220px_1fr_auto] items-start">
            <ImagenCampo etiqueta="Foto" valor={f.imageUrl || null} onChange={(url) => actualizar((x) => ({ ...x, galeria: x.galeria.map((y) => (y.key === f.key ? { ...y, imageUrl: url ?? '' } : y)) }))} ratio={4 / 3} etiquetaRatio="4:3" maxAncho={1400} />
            <Input aria-label="Pie de foto" placeholder="Pie de foto (opcional)" value={f.caption} onChange={(e) => actualizar((x) => ({ ...x, galeria: x.galeria.map((y) => (y.key === f.key ? { ...y, caption: e.target.value } : y)) }))} className="text-xs" />
            <Button type="button" variant="ghost" size="sm" aria-label="Quitar foto" onClick={() => actualizar((x) => ({ ...x, galeria: x.galeria.filter((y) => y.key !== f.key) }))}>
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => actualizar((x) => ({ ...x, galeria: [...x.galeria, { key: clave(), imageUrl: '', caption: '' }] }))}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />Agregar foto
        </Button>
      </Seccion>

      {/* 6. Inscritos (solo al editar) */}
      {id ? <Inscritos actividadId={id} capacidad={b.capacity ? Number(b.capacity) : null} titulo={b.title} /> : (
        <Seccion titulo="Inscritos" descripcion="Aparecen cuando guardes la actividad.">
          <p className="text-[11px] text-muted-foreground">Guarda primero la actividad para anotar inscritos.</p>
        </Seccion>
      )}

      <div className="sticky bottom-24 z-10 flex items-center justify-end gap-2 p-4 border border-border/60 bg-card/95 backdrop-blur rounded-2xl">
        <Button type="button" variant="outline" size="sm" onClick={() => irA('/agenda')} className="text-xs">Cancelar</Button>
        <Button type="submit" size="sm" disabled={guardar.isPending} className="text-xs">{guardar.isPending ? 'Guardando…' : 'Guardar'}</Button>
      </div>
    </form>
  );

  function cambiarSesion(key: string, cambios: Partial<Sesion>) {
    actualizarSesion(key, (s) => ({ ...s, ...cambios }));
  }
  function actualizarSesion(key: string, fn: (s: Sesion) => Sesion) {
    actualizar((p) => ({ ...p, sesiones: p.sesiones.map((s) => (s.key === key ? fn(s) : s)) }));
  }
  function cambiarBloque(sesionKey: string, bloqueKey: string, cambios: Partial<Bloque>) {
    actualizarSesion(sesionKey, (s) => ({ ...s, programa: s.programa.map((p) => (p.key === bloqueKey ? { ...p, ...cambios } : p)) }));
  }
};

// ---------- Piezas ----------

const Seccion: React.FC<{ titulo: string; descripcion?: string; children: React.ReactNode }> = ({ titulo, descripcion, children }) => (
  <Card className="border-border">
    <CardHeader className="space-y-1">
      <CardTitle className="text-sm font-semibold">{titulo}</CardTitle>
      {descripcion && <CardDescription className="text-xs">{descripcion}</CardDescription>}
    </CardHeader>
    <CardContent className="space-y-4 text-xs">{children}</CardContent>
  </Card>
);

const Campo: React.FC<{ id: string; etiqueta: string; children: React.ReactNode }> = ({ id, etiqueta, children }) => (
  <div>
    <EtiquetaCampo htmlFor={id}>{etiqueta}</EtiquetaCampo>
    {children}
  </div>
);

// Alta rápida de una sede (el nombre basta; dirección y mapa se pueden completar después)
const SedesRapidas: React.FC<{ sedes: { id: string; name: string }[] }> = ({ sedes }) => {
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState<string | null>(null);
  const crear = useMutacionGestion(
    (nombreSede: string) => luzApi.createSede({ name: nombreSede, address: "", city: "", mapUrl: "" }),
    'Sede agregada',
    'No se pudo agregar la sede',
  );
  return (
    <div className="rounded-xl bg-secondary/30 border border-border p-3 space-y-2">
      <p className="font-medium">Sedes del ministerio</p>
      <p className="text-[11px] text-muted-foreground">{sedes.length ? sedes.map((s) => s.name).join(' · ') : 'Todavía no hay sedes.'}</p>
      <div className="flex gap-2">
        <Input aria-label="Nombre de la nueva sede" value={nombre} onChange={(e) => { setNombre(e.target.value); setError(null); }} placeholder="Ej. Templo de El Alto" className="text-xs max-w-xs" />
        <Button type="button" variant="outline" size="sm" className="text-xs" disabled={nombre.trim().length < 2 || crear.isPending}
          onClick={async () => {
            if (nombre.trim().length < 2) return setError('Escribe el nombre de la sede.');
            await crear.mutateAsync(nombre.trim());
            setNombre('');
          }}>
          Agregar sede
        </Button>
      </div>
      <ErrorCampo texto={error} />
    </div>
  );
};

// Inscritos: lista, alta manual, estado, impresión y descarga
const Inscritos: React.FC<{ actividadId: string; capacidad: number | null; titulo: string }> = ({ actividadId, capacidad, titulo }) => {
  const lista = useInscritos(actividadId);
  const datos = lista.data ?? [];
  const activos = datos.filter((i) => i.status !== 'cancelada').length;
  const [nuevo, setNuevo] = useState({ fullName: '', phoneCode: PAIS_PREDETERMINADO, phone: '', email: '', status: 'confirmada', notes: '' });
  const [error, setError] = useState<string | null>(null);

  const anotar = useMutacionGestion(
    (datos: typeof nuevo) => luzApi.addInscritoManual(actividadId, datos),
    'Inscrito anotado',
    'No se pudo anotar',
  );
  const cambiarEstado = useMutacionGestion(
    ({ id, status }: { id: string; status: ApiInscrito['status'] }) => luzApi.setEstadoInscrito(id, status),
    'Estado actualizado',
    'No se pudo cambiar el estado',
  );
  const borrar = useMutacionGestion((id: string) => luzApi.deleteInscrito(id), 'Inscrito quitado', 'No se pudo quitar');

  const descargar = () => {
    const filas = [['Nombre', 'Teléfono', 'Correo', 'Origen', 'Estado', 'Fecha'], ...datos.map((i) => [
      i.fullName, i.phone ? `${i.phoneCode ?? ''} ${i.phone}`.trim() : '', i.email ?? '', i.origin === 'web' ? 'Web' : 'Manual', ESTADO[i.status], fechaLegible(i.createdAt),
    ])];
    const csv = filas.map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'inscritos.csv' });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const agregar = async () => {
    if (nuevo.fullName.trim().length < 3) return setError('Escribe el nombre completo.');
    if (!nuevo.phone.trim() && !nuevo.email.trim()) return setError('Escribe el teléfono o el correo.');
    setError(null);
    await anotar.mutateAsync(nuevo);
    setNuevo({ fullName: '', phoneCode: PAIS_PREDETERMINADO, phone: '', email: '', status: 'confirmada', notes: '' });
  };

  return (
    <Seccion titulo="Inscritos" descripcion="Los de la web y los que anotas a mano.">
      <style>{`#lista-imprimible{position:absolute;left:-10000px;top:0;width:700px}
@media print{body *{visibility:hidden}#lista-imprimible,#lista-imprimible *{visibility:visible}#lista-imprimible{left:0;top:0;width:100%}}`}</style>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-muted-foreground">{activos} inscritos{capacidad ? ` de ${capacidad} lugares` : ''}</span>
        <div className="ml-auto flex gap-2">
          <Button type="button" variant="outline" size="sm" className="text-xs" onClick={descargar} disabled={datos.length === 0}>
            <Download className="h-3.5 w-3.5 mr-1.5" />Excel (CSV)
          </Button>
          <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => window.print()} disabled={datos.length === 0}>
            <Printer className="h-3.5 w-3.5 mr-1.5" />Imprimir lista
          </Button>
        </div>
      </div>

      {lista.isLoading ? <p className="text-muted-foreground">Cargando…</p> : (
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/60 bg-secondary/30 text-left">
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Contacto</th>
                <th className="px-3 py-2 font-medium">Origen</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium text-right"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {datos.length === 0 && <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">Nadie inscrito todavía.</td></tr>}
              {datos.map((i) => (
                <tr key={i.id} className="border-b border-border/40">
                  <td className="px-3 py-2 font-medium">{i.fullName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{[i.phone ? `${i.phoneCode ?? ''} ${i.phone}`.trim() : null, i.email].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="px-3 py-2">{i.origin === 'web' ? 'Web' : 'Manual'}</td>
                  <td className="px-3 py-2">
                    <SelectField aria-label={`Estado de ${i.fullName}`} value={i.status} onChange={(e) => cambiarEstado.mutate({ id: i.id, status: e.target.value as ApiInscrito['status'] })} className="text-xs">
                      {INSCRIPCION_ESTADOS.map((s) => <option key={s} value={s}>{ESTADO[s]}</option>)}
                    </SelectField>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button type="button" variant="ghost" size="sm" aria-label={`Quitar a ${i.fullName}`} onClick={() => { if (window.confirm(`¿Quitar a ${i.fullName}?`)) borrar.mutate(i.id); }}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="rounded-xl bg-secondary/30 border border-border p-3 space-y-3">
        <p className="font-medium">Anotar a mano</p>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_110px_1fr_auto] items-end">
          <Input aria-label="Nombre completo" placeholder="Nombre completo" value={nuevo.fullName} onChange={(e) => setNuevo({ ...nuevo, fullName: e.target.value })} className="text-xs" />
          <div className="flex gap-2">
            <SelectField aria-label="Código de país" value={nuevo.phoneCode} onChange={(e) => setNuevo({ ...nuevo, phoneCode: e.target.value })} className="text-xs w-24">
              {PAISES.map((p) => <option key={p.codigo} value={p.codigo}>{p.codigo} {p.iso}</option>)}
            </SelectField>
            <Input aria-label="Teléfono" placeholder="Teléfono" value={nuevo.phone} onChange={(e) => setNuevo({ ...nuevo, phone: e.target.value })} className="text-xs" />
          </div>
          <SelectField aria-label="Estado inicial" value={nuevo.status} onChange={(e) => setNuevo({ ...nuevo, status: e.target.value })} className="text-xs">
            {INSCRIPCION_ESTADOS.map((s) => <option key={s} value={s}>{ESTADO[s]}</option>)}
          </SelectField>
          <Input aria-label="Correo" placeholder="Correo (opcional)" value={nuevo.email} onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })} className="text-xs" />
          <Button type="button" size="sm" className="text-xs" disabled={anotar.isPending} onClick={agregar}>Anotar</Button>
        </div>
        <ErrorCampo texto={error} />
      </div>

      <div id="lista-imprimible">
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>{titulo}</h2>
        <p>Lista de inscritos · {new Date().toLocaleDateString('es-BO')}</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead><tr>{['#', 'Nombre', 'Teléfono', 'Correo', 'Estado', 'Asistió'].map((h) => <th key={h} style={{ border: '1px solid #999', padding: 4, textAlign: 'left' }}>{h}</th>)}</tr></thead>
          <tbody>
            {datos.map((i, n) => (
              <tr key={i.id}>
                <td style={{ border: '1px solid #999', padding: 4 }}>{n + 1}</td>
                <td style={{ border: '1px solid #999', padding: 4 }}>{i.fullName}</td>
                <td style={{ border: '1px solid #999', padding: 4 }}>{i.phone ? `${i.phoneCode ?? ''} ${i.phone}` : ''}</td>
                <td style={{ border: '1px solid #999', padding: 4 }}>{i.email ?? ''}</td>
                <td style={{ border: '1px solid #999', padding: 4 }}>{ESTADO[i.status]}</td>
                <td style={{ border: '1px solid #999', padding: 4, width: 60 }}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Seccion>
  );
};

const ESTADO: Record<ApiInscrito['status'], string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  asistio: 'Asistió',
};
