import React, { useState } from 'react';
import {
  ArrowLeft,
  Heart,
  Share2,
  Bookmark,
  Clock,
  Eye,
  MessageSquare,
  Send,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { BlogPost } from '../types/blog.types';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';

interface BlogDetailTabProps {
  post: BlogPost;
  onBack: () => void;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, comment: { authorName: string; content: string }) => void;
}

export const BlogDetailTab: React.FC<BlogDetailTabProps> = ({
  post,
  onBack,
  onToggleLike,
  onAddComment,
}) => {
  const { play } = useSound();
  const [commentText, setCommentText] = useState('');
  const [authorName, setAuthorName] = useState('Mathew Anderson');
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleShare = () => {
    play('click');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    pillToast.success('Enlace Copiado', 'Enlace de publicación copiado al portapapeles.');
  };

  const handleBookmark = () => {
    play('pop');
    setIsBookmarked(!isBookmarked);
    pillToast.info(
      isBookmarked ? 'Marcador Retirado' : 'Artículo Guardado',
      isBookmarked ? 'Eliminado de artículos guardados.' : 'Artículo guardado en tu biblioteca.'
    );
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    play('success');
    onAddComment(post.id, {
      authorName: authorName.trim() || 'Desarrollador Invitado',
      content: commentText.trim(),
    });
    setCommentText('');
    pillToast.success('Comentario Enviado', 'Comentario verificado y publicado.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Top Bar Navigation & Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          aria-label="Volver al catálogo de artículos"
          onClick={() => {
            play('click');
            onBack();
          }}
          className="gap-2 text-xs text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label={post.isLiked ? "Quitar me gusta" : "Dar me gusta al artículo"}
            onClick={() => {
              play('pop');
              onToggleLike(post.id);
            }}
            className={cn(
              'h-8 px-3 rounded-xl text-xs gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-primary',
              post.isLiked
                ? 'text-rose-500 border-rose-500/30 bg-rose-500/10'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Heart
              className={cn('w-3.5 h-3.5', post.isLiked && 'fill-rose-500 text-rose-500')}
            />
            <span className="font-mono tabular-nums">{post.likesCount}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            aria-label={isBookmarked ? "Eliminar de artículos guardados" : "Guardar artículo en marcadores"}
            onClick={handleBookmark}
            className={cn(
              'h-8 px-3 rounded-xl text-xs gap-1.5 transition-all focus-visible:ring-2 focus-visible:ring-primary',
              isBookmarked
                ? 'text-amber-500 border-amber-500/30 bg-amber-500/10'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Bookmark
              className={cn('w-3.5 h-3.5', isBookmarked && 'fill-amber-500 text-amber-500')}
            />
            <span>{isBookmarked ? 'Guardado' : 'Guardar'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            aria-label="Compartir enlace de esta publicación"
            onClick={handleShare}
            className="h-8 px-3 rounded-xl text-xs gap-1.5 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Compartir</span>
          </Button>
        </div>
      </div>

      {/* Article Header Card */}
      <article className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-0.5">
              {post.category}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono tabular-nums">
              <Clock className="w-3.5 h-3.5 text-primary" />
              <span>{post.readingTime} de lectura</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-snug">
            {post.title}
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {post.excerpt}
          </p>

          {/* Author Metadata Bar */}
          <div className="pt-4 border-t border-border/40 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={post.authorAvatar}
                alt={post.authorName}
                className="w-11 h-11 rounded-full object-cover border border-border/60"
              />
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {post.authorName}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {post.authorRole}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {post.publishedAt}
              </span>
              <span className="flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                {post.viewsCount.toLocaleString()} lecturas
              </span>
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                {post.commentsCount} comentarios
              </span>
            </div>
          </div>
        </div>

        {/* Featured Cover Banner */}
        <div className="rounded-3xl overflow-hidden border border-border/50 bg-muted aspect-[21/9]">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Article Body Content */}
        <div className="rounded-3xl border border-border/50 bg-card/70 backdrop-blur-xl p-6 sm:p-10 space-y-6">
          <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-foreground/90 text-sm leading-relaxed whitespace-pre-line font-normal">
            {post.content}
          </div>

          {/* Key Insight Callout */}
          <div className="p-4 rounded-2xl bg-primary/5 border-l-4 border-primary text-xs leading-relaxed text-foreground/80 space-y-1">
            <span className="font-semibold text-primary block">
              Principio Arquitectural:
            </span>
            <p>
              La consistencia sensorial entre la respuesta auditiva, la ausencia de elementos decorativos superfluos y los números tabulares reduce la fatiga visual en un 38% durante jornadas de supervisión operativa continua.
            </p>
          </div>

          {/* Tags */}
          <div className="pt-6 border-t border-border/40 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium mr-1">
              Etiquetas:
            </span>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-lg text-xs font-mono bg-muted/70 text-muted-foreground border border-border/50"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </article>

      {/* Reader Comments Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Comentarios de la Comunidad ({post.comments.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Debates técnicos moderados bajo directivas de ingeniería
            </p>
          </div>
        </div>

        {/* New Comment Form */}
        <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">
              Escribir un Comentario
            </CardTitle>
            <CardDescription className="text-xs">
              Tu aporte quedará registrado como Mathew Anderson
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitComment} className="space-y-3">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Escribe tu reflexión, análisis o pregunta sobre este artículo..."
                rows={3}
                className="w-full p-3 rounded-xl bg-background/60 border border-border/60 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none leading-relaxed"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentText.trim()}
                  className="rounded-xl h-8 px-4 text-xs font-medium gap-1.5"
                >
                  <Send className="w-3 h-3" />
                  <span>Publicar Comentario</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Comments Stream */}
        <div className="space-y-3">
          {post.comments.length === 0 ? (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border/60 text-xs text-muted-foreground">
              Sé el primero en compartir una perspectiva técnica sobre este artículo.
            </div>
          ) : (
            post.comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={comment.authorAvatar}
                      alt={comment.authorName}
                      className="w-8 h-8 rounded-full object-cover border border-border/50"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">
                        {comment.authorName}
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        {comment.authorRole}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
                    {comment.date}
                  </span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed pl-10">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
};
