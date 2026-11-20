import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Keyboard,
  Sliders,
  Sparkles,
  Search,
  Code2,
  FileQuestion,
} from 'lucide-react';
import { docCategories, docArticles } from '../data/documentacion-data';
import { DocSidebar } from '../components/doc-sidebar';
import { DocContent } from '../components/doc-content';
import { Button } from '../../../shared/components/ui/button';
import { Badge } from '../../../shared/components/ui/badge';
import { useSound } from '../../../shared/context/sound-context';
import { useLayout } from '../../../shared/context/layout-context';
import { notify } from '../../../shared/lib/notify';

export const DocumentacionPage: React.FC = () => {
  const { play } = useSound();
  const { setIsCustomizerOpen } = useLayout();
  const [selectedArticleId, setSelectedArticleId] = useState<string>('arquitectura-kit');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter articles based on search query
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return docArticles;
    const q = searchQuery.toLowerCase();
    return docArticles.filter(
      (art) =>
        art.title.toLowerCase().includes(q) ||
        art.summary.toLowerCase().includes(q) ||
        art.tags.some((t) => t.toLowerCase().includes(q)) ||
        art.sections.some((s) =>
          s.heading.toLowerCase().includes(q) ||
          s.paragraphs.some((p) => p.toLowerCase().includes(q))
        )
    );
  }, [searchQuery]);

  // Selected article object
  const currentArticle = useMemo(() => {
    const found = filteredArticles.find((a) => a.id === selectedArticleId);
    return found || filteredArticles[0] || docArticles[0];
  }, [filteredArticles, selectedArticleId]);

  // Current category
  const currentCategory = useMemo(() => {
    if (!currentArticle) return undefined;
    return docCategories.find((c) => c.id === currentArticle.categoryId);
  }, [currentArticle]);

  // Calculate Next and Previous articles in the filtered list
  const currentIndex = filteredArticles.findIndex((a) => a.id === currentArticle?.id);
  const prevArticle = currentIndex > 0 ? filteredArticles[currentIndex - 1] : undefined;
  const nextArticle =
    currentIndex >= 0 && currentIndex < filteredArticles.length - 1
      ? filteredArticles[currentIndex + 1]
      : undefined;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
              Documentación & Manual de Usuario
            </h1>
            <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-primary">
              v2.4 Pro
            </Badge>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 max-w-2xl">
            Guía exhaustiva de arquitectura de software, directrices de diseño Apple HIG, manual de módulos y referencia técnica de desarrollo.
          </p>
        </div>

        {/* Quick Utilities */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              play('pop');
              // Trigger shortcut event Cmd+/
              window.dispatchEvent(
                new KeyboardEvent('keydown', { key: '/', metaKey: true, bubbles: true })
              );
            }}
            className="rounded-xl border-border/60 hover:bg-muted/50 gap-1.5 h-9 text-xs"
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span>Atajos (⌘/)</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              play('click');
              setIsCustomizerOpen(true);
            }}
            className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm gap-1.5 h-9 text-xs"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Personalizar Tema (⌘,)</span>
          </Button>
        </div>
      </div>

      {/* 2. Main Documentation Layout */}
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Left Sidebar */}
        <DocSidebar
          categories={docCategories}
          articles={filteredArticles}
          selectedArticleId={currentArticle?.id || ''}
          onSelectArticle={(id) => setSelectedArticleId(id)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Right Article Content */}
        {currentArticle ? (
          <DocContent
            article={currentArticle}
            category={currentCategory}
            prevArticle={prevArticle}
            nextArticle={nextArticle}
            onSelectArticle={(id) => setSelectedArticleId(id)}
          />
        ) : (
          <div className="flex-1 rounded-3xl border border-dashed border-border/70 p-12 text-center bg-card/20 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
              <FileQuestion className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No se encontraron artículos</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No hay coincidencias para &quot;{searchQuery}&quot;. Intenta buscar con otros términos clave como &quot;Sileo&quot;, &quot;Vite&quot; o &quot;DataTable&quot;.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl mt-2"
              onClick={() => setSearchQuery('')}
            >
              Restablecer Búsqueda
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
