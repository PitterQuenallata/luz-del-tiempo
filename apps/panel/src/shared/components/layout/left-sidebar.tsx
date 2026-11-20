import React from 'react';
import { navItems, navigationCategories } from '../../lib/navigation';
import { useSound } from '../../context/sound-context';
import { HookSidebar } from '../ui/hook-sidebar';
import { cn } from '../../lib/utils';

interface LeftSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ currentPath, onNavigate }) => {
  const { play } = useSound();

  return (
    <aside
      className={cn(
        'w-60 shrink-0 flex flex-col sticky top-14 h-[calc(100vh-3.5rem)] border-r border-border/70 bg-card/80 backdrop-blur-md',
        'max-md:hidden'
      )}
    >
      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {navigationCategories.map((cat) => {
          const items = navItems.filter((i) => i.category === cat.key);
          if (items.length === 0) return null;

          return (
            <div key={cat.key} className="space-y-1">
              <HookSidebar
                label={cat.title}
                items={items.map((i) => ({ label: i.title, href: i.path, badge: i.badge }))}
                currentPath={currentPath}
                color="var(--primary)"
                dashed={true}
                onChange={(idx) => {
                  play('tab');
                  const item = items[idx];
                  if (item) onNavigate(item.path);
                }}
              />
            </div>
          );
        })}
      </nav>
    </aside>
  );
};
