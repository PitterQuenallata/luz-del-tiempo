import React, { useState } from 'react';
import { Check, UploadCloud, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { BlogPost } from '../types/blog.types';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

interface BlogEditorTabProps {
  onPublishPost: (post: Omit<BlogPost, 'id' | 'viewsCount' | 'likesCount' | 'commentsCount' | 'comments'>) => void;
  onCancel: () => void;
}

const GALLERY_IMAGES = [
  '/images/gallery/blog-img1.jpg',
  '/images/gallery/blog-img2.jpg',
  '/images/gallery/blog-img3.jpg',
  '/images/gallery/blog-img4.jpg',
  '/images/gallery/blog-img5.jpg',
  '/images/gallery/blog-img6.jpg',
  '/images/gallery/blog-img7.jpg',
  '/images/gallery/blog-img8.jpg',
  '/images/gallery/blog-img9.jpg',
  '/images/gallery/blog-img10.jpg',
  '/images/gallery/blog-img11.jpg',
];

export const BlogEditorTab: React.FC<BlogEditorTabProps> = ({
  onPublishPost,
  onCancel,
}) => {
  const { play } = useSound();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<BlogPost['category']>('Design Systems');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState(GALLERY_IMAGES[0]);
  const [readingTime, setReadingTime] = useState('4 min');
  const [tagsInput, setTagsInput] = useState('Apple HIG, React 19, TypeScript');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<'published' | 'draft'>('published');

  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generatedSlug);
  };

  const handleSave = (chosenStatus: 'published' | 'draft') => {
    if (!title.trim()) {
      pillToast.error('Título Requerido', 'Por favor ingresa un título para el artículo.');
      return;
    }
    if (!content.trim()) {
      pillToast.error('Contenido Requerido', 'El contenido del artículo no puede estar vacío.');
      return;
    }

    play('success');

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    onPublishPost({
      slug: slug || 'articulo-sin-slug',
      title: title.trim(),
      excerpt: excerpt.trim() || title.slice(0, 100),
      content: content.trim(),
      category,
      coverImage,
      authorName: 'Mathew Anderson',
      authorRole: 'Lead Product Designer',
      authorAvatar: '/images/profile/user-1.jpg',
      readingTime,
      publishedAt: '28 Oct 2026',
      isFeatured,
      status: chosenStatus,
      tags: tags.length > 0 ? tags : ['Ingeniería'],
    });

    pillToast.success(
      chosenStatus === 'published' ? 'Artículo Publicado' : 'Borrador Guardado',
      chosenStatus === 'published'
        ? 'Publicación sincronizada y visible en el feed.'
        : 'Borrador almacenado en el repositorio.'
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            play('click');
            onCancel();
          }}
          className="gap-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave('draft')}
            className="h-8 px-3 rounded-xl text-xs font-medium"
          >
            Guardar Borrador
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave('published')}
            className="h-8 px-4 rounded-xl text-xs font-medium gap-1.5 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Publicar Artículo</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Contenido Editorial
              </CardTitle>
              <CardDescription className="text-xs">
                Redacta el manuscrito siguiendo normas de claridad y jerarquía tipográfica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Título del Artículo
                </label>
                <Input
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ej: Principios de Micro-Bordes en Sistemas Financieros"
                  className="rounded-xl text-xs h-9 bg-background/60"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Slug Identificador
                </label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="principios-micro-bordes-sistemas-financieros"
                  className="rounded-xl text-xs h-9 font-mono bg-background/60 text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Extracto / Resumen Introductorio
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Síntesis de 2 o 3 líneas que acompañará la tarjeta de previsualización..."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-background/60 border border-border/60 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Cuerpo del Manuscrito
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Desarrolla el análisis técnico aquí..."
                  rows={14}
                  className="w-full p-3 rounded-xl bg-background/60 border border-border/60 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono leading-relaxed"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Metadata & Image Selection */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Metadatos & Taxonomía
              </CardTitle>
              <CardDescription className="text-xs">
                Clasificación dentro del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Categoría
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-9 px-3 text-xs rounded-xl bg-background/60 border border-border/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="Design Systems">Design Systems</option>
                  <option value="Ingeniería Web">Ingeniería Web</option>
                  <option value="Arquitectura Cloud">Arquitectura Cloud</option>
                  <option value="Accesibilidad">Accesibilidad</option>
                  <option value="Fintech">Fintech</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Tiempo Estimado de Lectura
                </label>
                <Input
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value)}
                  placeholder="5 min"
                  className="rounded-xl text-xs h-9 bg-background/60 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Etiquetas (Separadas por coma)
                </label>
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Apple HIG, React, UX"
                  className="rounded-xl text-xs h-9 bg-background/60"
                />
              </div>

              <div className="pt-2 border-t border-border/40">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-xs font-medium text-foreground">
                    Marcar como Artículo Destacado (Hero)
                  </span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Cover Image Picker */}
          <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Imagen de Portada
              </CardTitle>
              <CardDescription className="text-xs">
                Selecciona una imagen de la galería de alta resolución
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl overflow-hidden border border-border/50 aspect-[16/9] bg-muted relative">
                <img
                  src={coverImage}
                  alt="Vista previa de portada"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {GALLERY_IMAGES.map((imgSrc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      play('click');
                      setCoverImage(imgSrc);
                    }}
                    className={cn(
                      'rounded-lg overflow-hidden border aspect-video relative transition-all',
                      coverImage === imgSrc
                        ? 'border-primary ring-2 ring-primary/40 scale-95'
                        : 'border-border/40 opacity-70 hover:opacity-100'
                    )}
                  >
                    <img
                      src={imgSrc}
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
