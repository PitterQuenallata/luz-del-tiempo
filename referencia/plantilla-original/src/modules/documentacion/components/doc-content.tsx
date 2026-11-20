import React from 'react';
import {
  Clock,
  Calendar,
  Share2,
  Info,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';
import { DocArticle, DocCategory } from '../types/documentacion.types';
import { DocCodeBlock } from './doc-code-block';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { notify } from '../../../shared/lib/notify';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';

interface DocContentProps {
  article: DocArticle;
  category?: DocCategory;
  prevArticle?: DocArticle;
  nextArticle?: DocArticle;
  onSelectArticle: (id: string) => void;
}

export const DocContent: React.FC<DocContentProps> = ({
  article,
  category,
  prevArticle,
  nextArticle,
  onSelectArticle,
}) => {
  const { play } = useSound();

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      play('pop');
      notify.success('Enlace de Documentación Copiado', 'Listo para compartir con tu equipo.');
    } catch {
      notify.info('Compartir', 'Copia la URL directamente de la barra de navegación.');
    }
  };

  const getCalloutIcon = (type: string) => {
    switch (type) {
      case 'tip':
        return <Lightbulb className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />;
      case 'important':
        return <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />;
    }
  };

  const getCalloutBorder = (type: string) => {
    switch (type) {
      case 'tip':
        return 'border-emerald-500/20 bg-emerald-500/5 text-emerald-950 dark:text-emerald-200';
      case 'warning':
        return 'border-amber-500/20 bg-amber-500/5 text-amber-950 dark:text-amber-200';
      case 'important':
        return 'border-rose-500/20 bg-rose-500/5 text-rose-950 dark:text-rose-200';
      case 'info':
      default:
        return 'border-blue-500/20 bg-blue-500/5 text-blue-950 dark:text-blue-200';
    }
  };

  return (
    <article className="flex-1 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-6 sm:p-8 lg:p-10 shadow-xs space-y-8 animate-fade-in">
      {/* 1. Article Header & Metadata */}
      <div className="space-y-4 border-b border-border/50 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Bookmark className="h-3.5 w-3.5 text-primary" />
            <span>{category?.title || 'Documentación'}</span>
            <span>/</span>
            <span className="text-foreground font-semibold">{article.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="h-8 px-2.5 text-xs rounded-xl gap-1.5 border-border/60 hover:bg-muted/50"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Compartir</span>
            </Button>
            {article.badge && (
              <Badge variant="secondary" className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary border-primary/20">
                {article.badge}
              </Badge>
            )}
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground font-heading">
          {article.title}
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl">
          {article.summary}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{article.readingTime}</span>
          </div>
          <span className="opacity-40">•</span>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Actualizado {article.lastUpdated}</span>
          </div>
          <span className="opacity-40">•</span>
          <div className="flex flex-wrap gap-1.5">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Article Sections Body */}
      <div className="space-y-8">
        {article.sections.map((section) => (
          <section key={section.id} id={section.id} className="space-y-4">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              {section.heading}
            </h2>

            {section.subheading && (
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.subheading}
              </p>
            )}

            <div className="space-y-3 text-sm sm:text-base text-foreground/85 leading-relaxed">
              {section.paragraphs.map((p, pIdx) => (
                <p key={pIdx}>{p}</p>
              ))}
            </div>

            {/* Bullets List */}
            {section.bullets && section.bullets.length > 0 && (
              <ul className="space-y-2 pl-2 text-sm text-foreground/80">
                {section.bullets.map((b, bIdx) => (
                  <li key={bIdx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Code Snippet Box */}
            {section.codeSnippet && (
              <DocCodeBlock
                code={section.codeSnippet.code}
                language={section.codeSnippet.language}
                filename={section.codeSnippet.filename}
              />
            )}

            {/* Callout Notice */}
            {section.callout && (
              <div
                className={cn(
                  'rounded-2xl border p-4 sm:p-5 flex items-start gap-3.5 my-4 transition-all',
                  getCalloutBorder(section.callout.type)
                )}
              >
                {getCalloutIcon(section.callout.type)}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    {section.callout.title}
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                    {section.callout.content}
                  </p>
                </div>
              </div>
            )}
          </section>
        ))}
      </div>

      {/* 3. Bottom Next / Previous Article Navigation */}
      <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {prevArticle ? (
          <button
            type="button"
            onClick={() => {
              play('tab');
              onSelectArticle(prevArticle.id);
            }}
            className="flex-1 p-4 rounded-2xl border border-border/60 hover:border-primary/40 bg-card/40 hover:bg-muted/40 transition-all text-left group"
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium group-hover:text-primary">
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
              <span>Anterior</span>
            </div>
            <div className="text-sm font-bold text-foreground mt-1 truncate">
              {prevArticle.title}
            </div>
          </button>
        ) : (
          <div className="flex-1" />
        )}

        {nextArticle ? (
          <button
            type="button"
            onClick={() => {
              play('tab');
              onSelectArticle(nextArticle.id);
            }}
            className="flex-1 p-4 rounded-2xl border border-border/60 hover:border-primary/40 bg-card/40 hover:bg-muted/40 transition-all text-right group"
          >
            <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground font-medium group-hover:text-primary">
              <span>Siguiente</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
            <div className="text-sm font-bold text-foreground mt-1 truncate">
              {nextArticle.title}
            </div>
          </button>
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </article>
  );
};
