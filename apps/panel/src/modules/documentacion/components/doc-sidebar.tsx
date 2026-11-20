import React from 'react';
import {
  Compass,
  Terminal,
  Palette,
  BellRing,
  LayoutGrid,
  Briefcase,
  Server,
  Search,
  FileText,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { DocCategory, DocArticle } from '../types/documentacion.types';
import { Input } from '../../../shared/components/ui/input';
import { Badge } from '../../../shared/components/ui/badge';
import { useSound } from '../../../shared/context/sound-context';
import { cn } from '../../../shared/lib/utils';

interface DocSidebarProps {
  categories: DocCategory[];
  articles: DocArticle[];
  selectedArticleId: string;
  onSelectArticle: (articleId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  Terminal,
  Palette,
  BellRing,
  LayoutGrid,
  Briefcase,
  Server,
};

export const DocSidebar: React.FC<DocSidebarProps> = ({
  categories,
  articles,
  selectedArticleId,
  onSelectArticle,
  searchQuery,
  onSearchChange,
  className,
}) => {
  const { play } = useSound();

  return (
    <aside
      className={cn(
        'w-full md:w-80 shrink-0 flex flex-col gap-4 rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl p-4 sm:p-5 shadow-xs',
        className
      )}
    >
      {/* Sidebar Header & Search */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Índice de Temas
          </span>
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-full font-semibold">
            {articles.length} Artículos
          </Badge>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar en la documentación..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8.5 pr-3 h-9 rounded-xl bg-background/80 border-border/60 text-xs focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* Categories & Articles Tree */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1 -mr-1 scrollbar-thin">
        {categories.map((cat) => {
          const catArticles = articles.filter((a) => a.categoryId === cat.id);
          if (catArticles.length === 0) return null;

          const IconComponent = iconMap[cat.iconName] || FileText;

          return (
            <div key={cat.id} className="space-y-1.5">
              {/* Category Header */}
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-foreground/90">
                <div className="h-5 w-5 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <IconComponent className="h-3 w-3" />
                </div>
                <span className="truncate">{cat.title}</span>
                {cat.badge && (
                  <span className="ml-auto text-[9px] px-1.5 py-0.2 rounded-md bg-secondary text-muted-foreground font-medium">
                    {cat.badge}
                  </span>
                )}
              </div>

              {/* Category Articles */}
              <div className="space-y-0.5 pl-3 border-l border-border/50 ml-2.5">
                {catArticles.map((art) => {
                  const isSelected = art.id === selectedArticleId;

                  return (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => {
                        play('tab');
                        onSelectArticle(art.id);
                      }}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-all select-none group',
                        isSelected
                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                    >
                      <span className="truncate pr-2">{art.title}</span>
                      <ChevronRight
                        className={cn(
                          'h-3 w-3 shrink-0 transition-transform opacity-40 group-hover:opacity-100',
                          isSelected && 'opacity-100 translate-x-0.5 text-primary-foreground'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
