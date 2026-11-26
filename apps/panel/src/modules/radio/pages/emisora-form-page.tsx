import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { radioSchema, type RadioInput } from '@luz/shared';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { SelectField } from '../../usuarios/components/select-field';
import { ApiRadio, luzApi } from '../../../shared/api/luz-api';
import { useUsuarios } from '../../usuarios/hooks/use-usuarios';
import { useMutacionGestion, useRadios } from '../../gestion/hooks/use-gestion';
import { irA } from '../../gestion/lib/navegar';
import { useAreas } from '../../contenido/hooks/use-contenido';
import { EtiquetaCampo, claseTextarea } from '../../contenido/components/dialogo-contenido';
import { ImagenCampo } from '../../contenido/components/imagen-campo';
import { slugDe } from '../../contenido/components/area-dialog';

// Emisora (contenedor). Pensada para entrar en una pantalla: foto y datos arriba, tipo y publicación en medio, contacto abajo.
// Una emisora de un tercero tiene un responsable y una sola estación. La del ministerio ya existe: no se crea otra.

type Estado = 'draft' | 'active' | 'suspended' | 'disabled';
const ETIQUETA_ESTADO: Record<Estado, string> = { draft: 'Borrador', active: 'Activa', suspended: 'Suspendida', disabled: 'Deshabilitada' };

// Sección del formulario: borde fino, sin sombra. Título pequeño como en los diálogos de la plantilla.
const Caja: React.FC<{ titulo?: string; className?: string; columnas?: 'dos' | 'cuatro'; children: React.ReactNode }> = ({ titulo, className, columnas = 'dos', children }) => (
  <section className={`rounded-xl border border-border p-4 ${className ?? ''}`}>
    {titulo && <h2 className="mb-3 text-sm font-semibold">{titulo}</h2>}
    <div className={`grid gap-3 ${columnas === 'cuatro' ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2'}`}>{children}</div>
  </section>
);

// Interruptor en línea: texto y switch juntos, sin ocupar una fila entera
const Interruptor: React.FC<{ id: string; titulo: string; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }> = ({ id, titulo, checked, disabled, onChange }) => (
  <div className="flex items-center gap-2">
    <Switch id={id} checked={checked} disabled={disabled} onCheckedChange={onChange} />
    <EtiquetaCampo htmlFor={id}>{titulo}</EtiquetaCampo>
  </div>
);

export const EmisoraFormPage: React.FC<{ emisora: ApiRadio | null }> = ({ emisora }) => {
  const areas = useAreas();
  const usuarios = useUsuarios();
  const radios = useRadios();
  const otraPrincipal = (radios.data ?? []).some((r) => r.isMain && r.id !== emisora?.id);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const volver = () => irA('/emisoras');

  const guardar = useMutacionGestion(
    (datos: RadioInput) => (emisora ? luzApi.updateRadio(emisora.id, datos) : luzApi.createRadio(datos)),
    emisora ? 'Emisora guardada' : 'Emisora creada',
    'No se pudo guardar la emisora',
  );

  // Estados que se ofrecen: «Borrador» solo aparece si la emisora ya estaba en borrador.
  const estadosOfrecidos = (Object.keys(ETIQUETA_ESTADO) as Estado[]).filter((e) => e !== 'draft' || emisora?.status === 'draft');

  const form = useForm({
    defaultValues: {
      name: emisora?.name ?? '',
      slug: emisora?.slug ?? '',
      description: emisora?.description ?? '',
      genre: emisora?.genre ?? '',
      kind: (emisora?.kind ?? 'external') as 'own' | 'external',
      imageUrl: emisora?.imageUrl ?? null,
      ownerUserId: emisora?.ownerUserId ?? '',
      isMain: emisora?.isMain ?? false,
      areaId: emisora?.areaId ?? '',
      operatedByName: emisora?.operatedByName ?? '',
      visibleInMinistry: emisora?.visibleInMinistry ?? true,
      status: (emisora?.status ?? 'active') as Estado,
      sortOrder: emisora?.sortOrder ?? 0,
      contactName: emisora?.contactName ?? '',
      contactPhone: emisora?.contactPhone ?? '',
      contactEmail: emisora?.contactEmail ?? '',
      notes: emisora?.notes ?? '',
    },
    onSubmit: async ({ value }) => {
      const parsed = radioSchema.safeParse({
        name: value.name,
        slug: value.slug,
        description: value.description.trim() || null,
        genre: value.genre.trim() || null,
        kind: value.kind,
        imageUrl: value.imageUrl,
        ownerUserId: value.kind === 'external' ? value.ownerUserId || null : null,
        isMain: value.isMain,
        areaId: value.areaId || null,
        operatedByName: value.kind === 'external' ? value.operatedByName.trim() || null : null,
        visibleInMinistry: value.visibleInMinistry,
        status: value.status,
        sortOrder: Number(value.sortOrder) || 0,
        contactName: value.contactName.trim() || null,
        contactPhone: value.contactPhone.trim() || null,
        contactEmail: value.contactEmail.trim() || '',
        notes: value.notes.trim() || null,
      });
      if (!parsed.success) {
        setErrorForm(parsed.error.issues[0]?.message ?? 'Revisa los datos.');
        return;
      }
      setErrorForm(null);
      await guardar.mutateAsync(parsed.data);
      volver();
    },
  });

  return (
    <form
      className="w-full space-y-4 pb-12"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <div>
        <button type="button" onClick={volver} className="text-xs text-primary hover:underline cursor-pointer">← Emisoras y estaciones</button>
        <p className="mt-2 text-xs text-muted-foreground font-mono">Radio / Emisoras / {emisora ? emisora.name : 'Nueva'}</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">{emisora ? emisora.name : 'Nueva emisora de un tercero'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {emisora ? 'Sus estaciones se gestionan desde Emisoras y estaciones.' : 'Tiene un responsable y una sola estación.'}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="space-y-4 p-5 text-xs">
      {/* Fila 1: foto y datos */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <Caja>
          <div className="sm:col-span-2">
            <form.Field name="imageUrl">
              {(f) => (
                <ImagenCampo etiqueta="Foto" valor={f.state.value} onChange={(url) => f.handleChange(url)} ratio={16 / 9} etiquetaRatio="16:9" recomendacion="Horizontal (16:9). Se muestra en la página de radio." />
              )}
            </form.Field>
          </div>
        </Caja>

        <Caja titulo="Datos">
          <form.Field name="name">
            {(f) => (
              <div>
                <EtiquetaCampo htmlFor="emisora-nombre">Nombre</EtiquetaCampo>
                <Input
                  id="emisora-nombre"
                  value={f.state.value}
                  onChange={(e) => {
                    f.handleChange(e.target.value);
                    if (!emisora) form.setFieldValue('slug', slugDe(e.target.value));
                  }}
                  className="text-xs"
                />
              </div>
            )}
          </form.Field>
          <form.Field name="slug">
            {(f) => (
              <div>
                <EtiquetaCampo htmlFor="emisora-slug">Enlace (slug)</EtiquetaCampo>
                <Input id="emisora-slug" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs font-mono" />
              </div>
            )}
          </form.Field>
          <form.Field name="genre">
            {(f) => (
              <div>
                <EtiquetaCampo htmlFor="emisora-genero">Género</EtiquetaCampo>
                <Input id="emisora-genero" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} placeholder="Alabanza" className="text-xs" />
              </div>
            )}
          </form.Field>
          <form.Field name="sortOrder">
            {(f) => (
              <div>
                <EtiquetaCampo htmlFor="emisora-orden">Orden en la web</EtiquetaCampo>
                <Input id="emisora-orden" type="number" min={0} value={f.state.value} onChange={(e) => f.handleChange(Number(e.target.value))} className="text-xs" />
              </div>
            )}
          </form.Field>
          <form.Field name="description">
            {(f) => (
              <div className="sm:col-span-2">
                <EtiquetaCampo htmlFor="emisora-descripcion">Descripción</EtiquetaCampo>
                <textarea id="emisora-descripcion" rows={2} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className={claseTextarea} />
              </div>
            )}
          </form.Field>
        </Caja>
      </div>

      {/* Fila 2: tipo y publicación */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Caja titulo="Tipo y responsable">
          <form.Field name="kind">
            {(f) => (
              <div>
                <EtiquetaCampo htmlFor="emisora-tipo">Tipo</EtiquetaCampo>
                <SelectField id="emisora-tipo" value={f.state.value} disabled={emisora?.isMain} onChange={(e) => f.handleChange(e.target.value as 'own' | 'external')}>
                  {emisora?.kind === 'own' && <option value="own">Del ministerio</option>}
                  {!emisora?.isMain && <option value="external">De un tercero</option>}
                </SelectField>
              </div>
            )}
          </form.Field>
          <form.Field name="areaId">
            {(f) => (
              <div>
                <EtiquetaCampo htmlFor="emisora-area">Área</EtiquetaCampo>
                <SelectField id="emisora-area" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)}>
                  <option value="">Sin área</option>
                  {(areas.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </SelectField>
              </div>
            )}
          </form.Field>
          <form.Subscribe selector={(st) => st.values.kind}>
            {(tipo) =>
              tipo === 'external' ? (
                <>
                  <form.Field name="operatedByName">
                    {(f) => (
                      <div>
                        <EtiquetaCampo htmlFor="emisora-operada">Operada por</EtiquetaCampo>
                        <Input id="emisora-operada" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} placeholder="Radio Pepito" className="text-xs" />
                      </div>
                    )}
                  </form.Field>
                  <form.Field name="ownerUserId">
                    {(f) => (
                      <div>
                        <EtiquetaCampo htmlFor="emisora-responsable">Responsable</EtiquetaCampo>
                        <SelectField id="emisora-responsable" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)}>
                          <option value="">Elige un usuario…</option>
                          {(usuarios.data ?? []).map((u) => <option key={u.id} value={u.id}>{u.name} · {u.email}</option>)}
                        </SelectField>
                      </div>
                    )}
                  </form.Field>
                  <p className="text-[11px] text-muted-foreground sm:col-span-2">El responsable solo verá esta emisora y su única estación.</p>
                </>
              ) : null
            }
          </form.Subscribe>
        </Caja>

        <Caja titulo="Publicación">
          <form.Field name="status">
            {(f) => (
              <div className="sm:col-span-2">
                <EtiquetaCampo htmlFor="emisora-estado">Estado</EtiquetaCampo>
                <SelectField id="emisora-estado" value={f.state.value} onChange={(e) => f.handleChange(e.target.value as Estado)}>
                  {estadosOfrecidos.map((valor) => <option key={valor} value={valor}>{ETIQUETA_ESTADO[valor]}</option>)}
                </SelectField>
              </div>
            )}
          </form.Field>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 sm:col-span-2">
            <form.Field name="visibleInMinistry">
              {(f) => <Interruptor id="emisora-visible" titulo="Visible en la web" checked={f.state.value} onChange={(v) => f.handleChange(v)} />}
            </form.Field>
            {/* La principal es solo de la emisora del ministerio; una emisora de tercero nunca lo es. */}
            <form.Subscribe selector={(st) => st.values.kind}>
              {(tipo) =>
                tipo === 'own' ? (
                  <>
                    <form.Field name="isMain">
                      {(f) => (
                        <Interruptor
                          id="emisora-principal"
                          titulo="Es la principal"
                          checked={f.state.value}
                          disabled={emisora?.isMain || (otraPrincipal && !f.state.value)}
                          onChange={(v) => f.handleChange(v)}
                        />
                      )}
                    </form.Field>
                    {emisora?.isMain ? <span className="text-[11px] text-muted-foreground">La principal no se puede quitar ni cambiar de tipo.</span> : otraPrincipal && <span className="text-[11px] text-muted-foreground">Ya hay una principal.</span>}
                  </>
                ) : null
              }
            </form.Subscribe>
          </div>
        </Caja>

      </div>

      {/* Fila 3: contacto interno */}
      <Caja titulo="Contacto interno" columnas="cuatro">
        <form.Field name="contactName">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="emisora-contacto">Persona de contacto</EtiquetaCampo>
              <Input id="emisora-contacto" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
            </div>
          )}
        </form.Field>
        <form.Field name="contactPhone">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="emisora-telefono">Teléfono</EtiquetaCampo>
              <Input id="emisora-telefono" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
            </div>
          )}
        </form.Field>
        <form.Field name="contactEmail">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="emisora-correo">Correo</EtiquetaCampo>
              <Input id="emisora-correo" type="email" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
            </div>
          )}
        </form.Field>
        <form.Field name="notes">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="emisora-notas">Notas</EtiquetaCampo>
              <Input id="emisora-notas" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="text-xs" />
            </div>
          )}
        </form.Field>
      </Caja>

      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 rounded-b-2xl border-t border-border/60 bg-card p-4">
        {errorForm && <p className="mr-auto text-xs text-red-400">{errorForm}</p>}
        <Button type="button" variant="outline" className="text-xs" onClick={volver}>Cancelar</Button>
        <form.Subscribe selector={(s) => s.canSubmit}>
          {(puedeEnviar) => (
            <Button type="submit" className="text-xs" disabled={!puedeEnviar || guardar.isPending}>
              {guardar.isPending ? 'Guardando…' : emisora ? 'Guardar cambios' : 'Crear emisora'}
            </Button>
          )}
        </form.Subscribe>
      </div>
      </div>
    </form>
  );
};
