import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { Switch } from '../../../shared/components/ui/switch';
import { GooeyNav } from '../../../shared/components/ui/gooey-nav';
import { HookSidebar } from '../../../shared/components/ui/hook-sidebar';
import { AppleEmojiPicker, EmojiItem } from '@/components/ui/apple-emoji-picker';
import { Dock, DockItem, DockLabel, DockIcon, DockSeparator, AppleStyleDock } from '@/components/ui/dock';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';
import {
  Layers,
  Sparkles,
  Sliders,
  Maximize2,
  Smartphone,
  Compass,
  Smile,
  Home,
  Package,
  LayoutGrid,
  Activity,
  FileText,
  Mail,
  Moon,
} from 'lucide-react';

export const ComponentsSurfacesTab: React.FC = () => {
  const { play } = useSound();
  const [gooeyIndex, setGooeyIndex] = useState(1);
  const [hookIndex, setHookIndex] = useState(0);
  const [glassEffectActive, setGlassEffectActive] = useState(true);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Rare-UI: GooeyNav & HookSidebar Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GooeyNav */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="text-[10px]">
                Rare UI
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                Spring Physics
              </Badge>
            </div>
            <CardTitle>GooeyNav (Dock Inferior iOS)</CardTitle>
            <CardDescription>
              Navegación fluida con física de resorte y curvas cóncavas orgánicas trazadas en SVG dinámico.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-2xl space-y-4">
            <GooeyNav
              items={['General', 'Facturación', 'Seguridad', 'Auditoría']}
              value={gooeyIndex}
              onChange={(i) => {
                play('tab');
                setGooeyIndex(i);
              }}
              size="sm"
            />
            <p className="text-[11px] text-muted-foreground font-mono">
              Pestaña activa: {['General', 'Facturación', 'Seguridad', 'Auditoría'][gooeyIndex]}
            </p>
          </CardContent>
        </Card>

        {/* HookSidebar */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="default" className="text-[10px]">
                Rare UI
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                Riel Curvo SVG
              </Badge>
            </div>
            <CardTitle>HookSidebar (Guía de Navegación Sub-Sección)</CardTitle>
            <CardDescription>
              Riel animado con resorte de precisión que traza el ítem activo y el hover con curvatura SVG.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <HookSidebar
              label="Estructura de Dominio"
              items={[
                { label: 'Servicios en la Nube', badge: 'Activo' },
                { label: 'Bases de Datos Clúster' },
                { label: 'Pasarelas de Pago' },
                { label: 'Tokens de Acceso' },
              ]}
              value={hookIndex}
              onChange={(i) => {
                play('tab');
                setHookIndex(i);
              }}
              color="var(--primary)"
              dashed={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* 21st.dev / ibelick macOS Proximity Magnification Dock */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="text-[10px]">
                  21st.dev / ibelick
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  macOS Magnification
                </Badge>
              </div>
              <CardTitle>macOS Dock (Efecto de Proximidad Física)</CardTitle>
              <CardDescription>
                Pasa el cursor por encima: los iconos aumentan de tamaño suavemente con interpolación gaussiana y física de resorte (Framer Motion), idéntico al Dock de macOS.
              </CardDescription>
            </div>
            <div className="font-mono text-xs text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-xl border border-border/60">
              <code>npx shadcn add "https://21st.dev/r/ibelick/dock"</code>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-8 bg-muted/20 dark:bg-neutral-950/80 rounded-2xl border border-border/60 dark:border-white/10 min-h-[180px]">
          <AppleStyleDock />
        </CardContent>
      </Card>

      {/* Apple Emoji & Symbol Picker Showcase */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="text-[10px]">
                  Input Control
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  Apple Character Palette
                </Badge>
              </div>
              <CardTitle>Selector Flotante de Emojis & Símbolos (Apple Palette)</CardTitle>
              <CardDescription>
                Herramienta de selección para editores de texto, chat corporativo y comentarios, preservando el cromo de la interfaz libre de emojis conforme a las directivas HIG.
              </CardDescription>
            </div>

            <Button
              variant="gradientBlue"
              size="sm"
              onClick={() => {
                play('pop');
                setIsEmojiPickerOpen(true);
              }}
              className="gap-2 text-xs h-9 shrink-0"
            >
              <Smile className="h-4 w-4" />
              <span>Abrir Paleta de Emojis</span>
              <kbd className="font-mono text-[9px] bg-white/20 px-1 py-0.2 rounded">
                ⌃⌘Space
              </kbd>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-5 rounded-2xl bg-muted/20 border border-border/50">
            <div className="flex items-center gap-4">
              <div
                onClick={() => {
                  play('pop');
                  setIsEmojiPickerOpen(true);
                }}
                className="h-16 w-16 rounded-2xl bg-card border border-border flex items-center justify-center text-3xl shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer select-none"
                title="Haz clic para cambiar el emoji"
              >
                {selectedEmoji ? selectedEmoji : <Sparkles className="h-6 w-6 text-primary" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Emoji Seleccionado Actualmente</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Haz clic en el recuadro o en el botón superior para desplegar la paleta modal con categorías y búsqueda.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Listo para editores de texto y chat</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emoji Picker Modal */}
      <AppleEmojiPicker
        isOpen={isEmojiPickerOpen}
        onClose={() => setIsEmojiPickerOpen(false)}
        onEmojiSelect={(emoji: EmojiItem) => {
          setSelectedEmoji(emoji.native);
          pillToast.success('Emoji Seleccionado', `${emoji.native} (${emoji.name}) seleccionado.`);
        }}
      />

      {/* Liquid Glass Showcase */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="blue" className="text-[10px]">
              Liquid Glass
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              Backdrop Filter
            </Badge>
          </div>
          <CardTitle>Material Translúcido Liquid Glass (Apple HIG)</CardTitle>
          <CardDescription>
            Separación de la capa funcional de controles sobre el plano de contenido mediante desenfoque gaussiano y saturación óptica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative p-6 sm:p-10 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-amber-500/10 border border-border">
            {/* Background elements simulating page content */}
            <div className="grid grid-cols-3 gap-3 opacity-40 blur-[1px] select-none pointer-events-none mb-6">
              <div className="h-16 rounded-xl bg-primary/30" />
              <div className="h-16 rounded-xl bg-purple-500/30" />
              <div className="h-16 rounded-xl bg-emerald-500/30" />
            </div>

            {/* Floating Glass Panel */}
            <div
              className={cn(
                'relative z-10 max-w-md mx-auto p-5 rounded-2xl border transition-all duration-300',
                glassEffectActive
                  ? 'backdrop-blur-xl bg-card/70 border-white/20 dark:border-white/10 shadow-lg'
                  : 'bg-card border-border shadow-xs'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-xs text-foreground">Panel Flotante Activo</span>
                </div>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  Z-Index 40
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                El efecto Liquid Glass permite que los elementos cromáticos subyacentes proyecten tonalidades sutiles a través de la superficie del control.
              </p>

              <div className="flex items-center justify-between pt-3 border-t border-border/40">
                <span className="text-xs font-semibold text-foreground">Activar Filtro Glass:</span>
                <Switch
                  checked={glassEffectActive}
                  onCheckedChange={(checked) => {
                    play('toggle');
                    setGlassEffectActive(checked);
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
