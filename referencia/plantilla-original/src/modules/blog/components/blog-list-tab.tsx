import React, { useState, useMemo } from 'react';
import { Search, Plus, Eye, MessageSquare, Clock, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { Input } from '../../../shared/components/ui/input';
import { BlogPost } from '../types/blog.types';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';

interface BlogListTabProps {
  posts: BlogPost[];
  onSelectPost: (post: BlogPost) => void;
  onNavigateToEditor: () => void;
}

const CATEGORIES = [
  'Todos',
  'Design Systems',
  'Ingeniería Web',
  'Arquitectura Cloud',
  'Accesibilidad',
  'Fintech',
] as const;

export const BlogListTab: React.FC<BlogListTabProps> = ({
  posts,
  onSelectPost,
  onNavigateToEditor,
}) => {
  const { play } = useSound();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'views' | 'comments'>('recent');

  // Count articles per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Todos: posts.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== 'Todos') {
        counts[cat] = posts.filter((p) => p.category === cat).length;
      }
    });
    return counts;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        const matchesCategory =
          selectedCategory === 'Todos' || post.category === selectedCategory;
        const matchesSearch =
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'views') return b.viewsCount - a.viewsCount;
        if (sortBy === 'comments') return b.commentsCount - a.commentsCount;
        return 0; // Default ordering is recent
      });
  }, [posts, selectedCategory, searchQuery, sortBy]);

  // Featured post: highlighted hero when looking at "Todos" or when explicitly marked as featured
  const featuredPost = useMemo(() => {
    if (selectedCategory === 'Todos') {
      return filteredPosts.find((p) => p.isFeatured) || filteredPosts[0];
    }
    return filteredPosts.find((p) => p.isFeatured) || null;
  }, [filteredPosts, selectedCategory]);

  const regularPosts = useMemo(() => {
    if (!featuredPost) return filteredPosts;
    return filteredPosts.filter((p) => p.id !== featuredPost.id);
  }, [filteredPosts, featuredPost]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Controls: Search, Sort and Actions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Filter Pills with Accessible Tabs */}
        <div
          role="tablist"
          aria-label="Filtrar publicaciones por categoría"
          className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none"
        >
          {CATEGORIES.map((category) => {
            const count = categoryCounts[category] || 0;
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                role="tab"
                type="button"
                aria-selected={isSelected}
                aria-label={`${category}: ${count} artículos`}
                onClick={() => {
                  play('click');
                  setSelectedCategory(category);
                }}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                  isSelected
                    ? 'bg-foreground text-background border-foreground shadow-sm'
                    : 'bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground border-border/50'
                )}
              >
                <span>{category}</span>
                <span
                  className={cn(
                    'text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded-full',
                    isSelected
                      ? 'bg-background/20 text-background font-bold'
                      : 'bg-muted/80 text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[200px] lg:min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar publicaciones o tags..."
              aria-label="Buscar publicaciones o tags"
              className="pl-9 h-9 text-xs rounded-xl bg-card/60 border-border/60 focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => {
              play('click');
              setSortBy(e.target.value as any);
            }}
            aria-label="Ordenar publicaciones"
            className="h-9 px-3 text-xs rounded-xl bg-card/60 border border-border/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="recent">Más recientes</option>
            <option value="views">Más leídos</option>
            <option value="comments">Más comentados</option>
          </select>

          <Button
            onClick={() => {
              play('pop');
              onNavigateToEditor();
            }}
            className="h-9 px-4 rounded-xl gap-1.5 text-xs font-medium shadow-sm whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Redactar Artículo</span>
          </Button>
        </div>
      </div>

      {/* Featured Hero Article Banner */}
      {featuredPost && (
        <div
          role="article"
          tabIndex={0}
          aria-label={`Artículo destacado: ${featuredPost.title}`}
          onClick={() => {
            play('click');
            onSelectPost(featuredPost);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              play('click');
              onSelectPost(featuredPost);
            }
          }}
          className="group relative rounded-3xl border border-border/50 bg-card/70 backdrop-blur-xl overflow-hidden hover:border-primary/40 hover:shadow-xl transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Visual Cover */}
            <div className="lg:col-span-7 relative h-64 lg:h-96 overflow-hidden">
              <img
                src={featuredPost.coverImage}
                alt={featuredPost.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent lg:hidden" />
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <Badge variant="outline" className="bg-background/90 backdrop-blur-md border-border/60 text-foreground font-semibold text-xs px-2.5 py-0.5">
                  Destacado
                </Badge>
                <Badge variant="secondary" className="bg-primary/90 text-primary-foreground text-xs px-2.5 py-0.5">
                  {featuredPost.category}
                </Badge>
              </div>
            </div>

            {/* Editorial Content */}
            <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>{featuredPost.readingTime} de lectura</span>
                  <span>•</span>
                  <span>{featuredPost.publishedAt}</span>
                </div>

                <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-foreground group-hover:text-primary transition-colors leading-snug">
                  {featuredPost.title}
                </h2>

                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                  {featuredPost.excerpt}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {featuredPost.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[11px] font-mono bg-muted/60 text-muted-foreground border border-border/40"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Author & Footer Metrics */}
              <div className="pt-6 mt-4 border-t border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={featuredPost.authorAvatar}
                    alt={featuredPost.authorName}
                    className="w-10 h-10 rounded-full object-cover border border-border/50"
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">
                      {featuredPost.authorName}
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      {featuredPost.authorRole}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {featuredPost.viewsCount.toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {featuredPost.commentsCount}
                  </span>
                  <div className="p-1.5 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Articles */}
      <div id="articles-grid" role="region" aria-label="Listado de artículos">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground">
              {selectedCategory === 'Todos'
                ? 'Artículos & Publicaciones'
                : `Publicaciones en ${selectedCategory}`}
            </h3>
            <p className="text-xs text-muted-foreground">
              Mostrando {regularPosts.length + (featuredPost ? 1 : 0)} análisis editoriales
            </p>
          </div>
        </div>

        {regularPosts.length === 0 && !featuredPost ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-border/60 bg-card/40">
            <p className="text-sm font-medium text-foreground">
              No se encontraron artículos en {selectedCategory}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Prueba cambiando los filtros o buscando con otros términos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <div
                key={post.id}
                role="article"
                tabIndex={0}
                aria-label={`Leer artículo: ${post.title}`}
                onClick={() => {
                  play('click');
                  onSelectPost(post);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    play('click');
                    onSelectPost(post);
                  }
                }}
                className="group flex flex-col rounded-2xl border border-border/50 bg-card/70 backdrop-blur-xl overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all duration-300 cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                {/* Thumbnail */}
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge
                      variant="secondary"
                      className="bg-background/90 backdrop-blur-md text-foreground border border-border/50 text-[11px] font-medium px-2 py-0.5"
                    >
                      {post.category}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-mono tabular-nums bg-background/90 backdrop-blur-md text-muted-foreground border border-border/50">
                      {post.readingTime}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono tabular-nums text-muted-foreground">
                      {post.publishedAt}
                    </div>
                    <h4 className="text-sm font-semibold tracking-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                      {post.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>

                  {/* Footer Meta */}
                  <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-7 h-7 rounded-full object-cover border border-border/50"
                      />
                      <span className="text-xs font-medium text-foreground">
                        {post.authorName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.viewsCount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {post.commentsCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
