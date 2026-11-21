import React from 'react';
import { useForm } from '@tanstack/react-form';
import { heroSchema } from '@luz/shared';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { mensajeCampo } from '../../../shared/lib/form';
import { ApiHero } from '../../../shared/api/luz-api';
import { useGuardarHero } from '../hooks/use-contenido';
import { DialogoContenido, EtiquetaCampo, ErrorCampo } from './dialogo-contenido';
import { ImagenCampo } from './imagen-campo';

interface HeroDialogProps {
  slide: ApiHero | null; // null = nueva diapositiva
  siguienteOrden: number;
  onClose: () => void;
}

// Diapositiva del carrusel de la portada (TanStack Form + heroSchema de @luz/shared).
export const HeroDialog: React.FC<HeroDialogProps> = ({ slide, siguienteOrden, onClose }) => {
  const guardar = useGuardarHero(slide?.id ?? null);

  const form = useForm({
    defaultValues: {
      eyebrow: slide?.eyebrow ?? '',
      title: slide?.title ?? '',
      subtitle: slide?.subtitle ?? '',
      ghost: (slide?.ghost ?? ['', '', '']) as [string, string, string],
      ctaLabel: slide?.ctaLabel ?? 'Escuchar ahora',
      ctaTo: slide?.ctaTo ?? '/',
      imageUrl: slide?.imageUrl ?? null,
      tint: slide?.tint ?? '#0b1324',
      sortOrder: slide?.sortOrder ?? siguienteOrden,
      isPublished: slide?.isPublished ?? true,
    },
    validators: { onChange: heroSchema as any, onSubmit: heroSchema as any },
    onSubmit: async ({ value }) => {
      await guardar.mutateAsync(heroSchema.parse(value));
      onClose();
    },
  });

  return (
    <form.Subscribe selector={(s) => s.canSubmit}>
    {(puedeEnviar) => (
    <DialogoContenido
      titulo={slide ? 'Editar diapositiva' : 'Nueva diapositiva'}
      onClose={onClose}
      onSubmit={() => form.handleSubmit()}
      textoBoton={slide ? 'Guardar' : 'Crear'}
      puedeEnviar={puedeEnviar}
      enviando={guardar.isPending}
    >
      <form.Field name="imageUrl">
        {(f) => (
          <ImagenCampo
            etiqueta="Imagen de fondo"
            valor={f.state.value}
            onChange={(url) => f.handleChange(url)}
            recomendacion="Horizontal (16:9), al menos 1600 × 900. El texto va a la izquierda, así que el sujeto debe ir a la derecha."
          />
        )}
      </form.Field>

      <form.Field name="eyebrow">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="hero-eyebrow">Texto superior</EtiquetaCampo>
            <Input id="hero-eyebrow" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} placeholder="ej. Radio en vivo" className="text-xs" />
            <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <form.Field name="title">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="hero-titulo">Título</EtiquetaCampo>
            <Input id="hero-titulo" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="text-xs" />
            <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <form.Field name="subtitle">
        {(f) => (
          <div>
            <EtiquetaCampo htmlFor="hero-subtitulo">Subtítulo</EtiquetaCampo>
            <textarea id="hero-subtitulo" rows={3} value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring" />
            <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <form.Field name="ghost">
        {(f) => (
          <div>
            <span className="font-medium block mb-1.5">Texto grande y tenue (marca de agua, 3 líneas)</span>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <Input
                  key={i}
                  aria-label={`Línea ${i + 1} del texto tenue`}
                  value={f.state.value[i] ?? ''}
                  onChange={(e) => {
                    const nuevo = [...f.state.value] as [string, string, string];
                    nuevo[i] = e.target.value;
                    f.handleChange(nuevo);
                  }}
                  placeholder={`Línea ${i + 1}`}
                  className="text-xs"
                />
              ))}
            </div>
            <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3">
        <form.Field name="ctaLabel">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="hero-boton">Texto del botón</EtiquetaCampo>
              <Input id="hero-boton" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} className="text-xs" />
              <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
            </div>
          )}
        </form.Field>
        <form.Field name="ctaTo">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="hero-enlace">Enlace del botón</EtiquetaCampo>
              <Input id="hero-enlace" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={f.handleBlur} placeholder="/radio" className="text-xs font-mono" />
              <ErrorCampo texto={mensajeCampo(f.state.meta.errors)} />
            </div>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-2 gap-3 items-end">
        <form.Field name="tint">
          {(f) => (
            <div>
              <EtiquetaCampo htmlFor="hero-color">Color de acento</EtiquetaCampo>
              <div className="flex items-center gap-2">
                <input id="hero-color" type="color" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} className="h-9 w-12 rounded-lg border border-border bg-background cursor-pointer" />
                <span className="font-mono text-[11px] text-muted-foreground">{f.state.value}</span>
              </div>
            </div>
          )}
        </form.Field>
        <form.Field name="isPublished">
          {(f) => (
            <div className="flex items-center justify-between gap-2 pb-1">
              <EtiquetaCampo htmlFor="hero-publicada">Publicada</EtiquetaCampo>
              <Switch id="hero-publicada" checked={f.state.value} onCheckedChange={(v) => f.handleChange(v)} />
            </div>
          )}
        </form.Field>
      </div>
    </DialogoContenido>
    )}
    </form.Subscribe>
  );
};
