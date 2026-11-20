import React, { useState } from 'react';
import { MorphIcon } from 'morphicons/react';
import {
  Menu,
  X,
  Play,
  Pause,
  Sun,
  Moon,
  Check,
  Copy,
  Lock,
  Unlock,
  Eye,
  EyeOff,
} from 'lucide';
import {
  ActivityIcon,
  BellRingIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
  DownloadIcon,
  RefreshCwIcon,
  ZapIcon,
  CreditCardIcon,
  HeartIcon,
  LockIcon,
  CompassIcon,
} from '@animateicons/react/lucide';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { useSound } from '../../../shared/context/sound-context';
import { notify } from '../../../shared/lib/notify';
import { cn } from '../../../shared/lib/utils';

export const ComponentsIconsTab: React.FC = () => {
  const { play } = useSound();

  // Morphicon Interactive State Toggles
  const [isPlayActive, setIsPlayActive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isEyeVisible, setIsEyeVisible] = useState(false);

  // Controlled Morph Progress
  const [morphProgress, setMorphProgress] = useState(50);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. MORPHICONS SECTION: Continuous Vector Morphing */}
      <Card className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-xs overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground font-mono">
                  morphicons 2.0
                </span>
              </div>
              <CardTitle className="text-lg font-bold tracking-tight text-foreground font-heading">
                Morfismo Vectorial Continuo
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Transforma cualquier icono SVG en otro mediante físicas de resortes elásticos sin saltos de fotogramas.
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                play('click');
                notify.success('Morphicons Copiado', 'import { MorphIcon } from "morphicons/react"');
              }}
              className="text-xs h-8 rounded-xl border-border/60 hover:bg-muted/50 self-start sm:self-auto"
            >
              <span>Copiar Import</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Interactive State Toggle Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Play / Pause */}
            <button
              type="button"
              onClick={() => {
                play('pop');
                setIsPlayActive((prev) => !prev);
              }}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-center group cursor-pointer"
            >
              <div className="h-12 w-12 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs">
                <MorphIcon
                  icon={isPlayActive ? Pause : Play}
                  size={24}
                  spring="snappy"
                />
              </div>
              <span className="text-xs font-semibold text-foreground mt-3">
                {isPlayActive ? 'Pausa' : 'Play'}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Play ⇄ Pause
              </span>
            </button>

            {/* 2. Menu / Close */}
            <button
              type="button"
              onClick={() => {
                play('pop');
                setIsMenuOpen((prev) => !prev);
              }}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-center group cursor-pointer"
            >
              <div className="h-12 w-12 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs">
                <MorphIcon
                  icon={isMenuOpen ? X : Menu}
                  size={24}
                  spring="snappy"
                />
              </div>
              <span className="text-xs font-semibold text-foreground mt-3">
                {isMenuOpen ? 'Cerrar' : 'Menú'}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Menu ⇄ Close
              </span>
            </button>

            {/* 3. Sun / Moon */}
            <button
              type="button"
              onClick={() => {
                play('switch');
                setIsDarkMode((prev) => !prev);
              }}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-center group cursor-pointer"
            >
              <div className="h-12 w-12 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs">
                <MorphIcon
                  icon={isDarkMode ? Moon : Sun}
                  size={24}
                  spring="smooth"
                />
              </div>
              <span className="text-xs font-semibold text-foreground mt-3">
                {isDarkMode ? 'Oscuro' : 'Claro'}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Sun ⇄ Moon
              </span>
            </button>

            {/* 4. Copy / Check */}
            <button
              type="button"
              onClick={() => {
                play('pop');
                setIsCopied((prev) => !prev);
              }}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-center group cursor-pointer"
            >
              <div className="h-12 w-12 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs">
                <MorphIcon
                  icon={isCopied ? Check : Copy}
                  size={24}
                  spring="bouncy"
                />
              </div>
              <span className="text-xs font-semibold text-foreground mt-3">
                {isCopied ? 'Copiado' : 'Copiar'}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Copy ⇄ Check
              </span>
            </button>

            {/* 5. Lock / Unlock */}
            <button
              type="button"
              onClick={() => {
                play('pop');
                setIsLocked((prev) => !prev);
              }}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-center group cursor-pointer"
            >
              <div className="h-12 w-12 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs">
                <MorphIcon
                  icon={isLocked ? Unlock : Lock}
                  size={24}
                  spring="snappy"
                />
              </div>
              <span className="text-xs font-semibold text-foreground mt-3">
                {isLocked ? 'Abierto' : 'Bloqueado'}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Lock ⇄ Unlock
              </span>
            </button>

            {/* 6. Eye / EyeOff */}
            <button
              type="button"
              onClick={() => {
                play('pop');
                setIsEyeVisible((prev) => !prev);
              }}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-center group cursor-pointer"
            >
              <div className="h-12 w-12 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs">
                <MorphIcon
                  icon={isEyeVisible ? EyeOff : Eye}
                  size={24}
                  spring="snappy"
                />
              </div>
              <span className="text-xs font-semibold text-foreground mt-3">
                {isEyeVisible ? 'Oculto' : 'Visible'}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Eye ⇄ EyeOff
              </span>
            </button>
          </div>

          {/* Continuous Progress Morphing Slider */}
          <div className="rounded-2xl border border-border/50 bg-muted/15 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="h-14 w-14 rounded-2xl bg-background border border-border/60 flex items-center justify-center text-foreground shadow-xs shrink-0">
                <MorphIcon
                  from={Menu}
                  to={X}
                  progress={morphProgress / 100}
                  size={28}
                />
              </div>
              <div>
                <span className="text-xs font-bold text-foreground">
                  Interpolación Continua (Menu -&gt; X)
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Arrastra el controlador para pausar la deformación de vectores en cualquier porcentaje intermedio.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-64">
              <input
                type="range"
                min="0"
                max="100"
                value={morphProgress}
                onChange={(e) => setMorphProgress(Number(e.target.value))}
                className="w-full accent-foreground cursor-pointer h-1.5 rounded-lg bg-muted-foreground/20"
              />
              <span className="text-xs font-mono font-bold text-foreground tabular-nums w-10 text-right">
                {morphProgress}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. ANIMATEICONS SECTION: Hover Micro-Animations */}
      <Card className="rounded-3xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-xs overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground font-mono">
                  @animateicons/react
                </span>
              </div>
              <CardTitle className="text-lg font-bold tracking-tight text-foreground font-heading">
                Micro-Animaciones Cinéticas (Hover & Motion)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Iconos interactivos impulsados por físicas de amortiguación elástica que reaccionan de inmediato al pasar el cursor.
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                play('click');
                notify.success('AnimateIcons Copiado', 'import { BellRingIcon } from "@animateicons/react/lucide"');
              }}
              className="text-xs h-8 rounded-xl border-border/60 hover:bg-muted/50 self-start sm:self-auto"
            >
              <span>Copiar Import</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* 1. Activity */}
            <div
              onMouseEnter={() => play('pop')}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                <ActivityIcon size={20} />
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground block truncate">
                  ActivityIcon
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Pulso de telemetría
                </span>
              </div>
            </div>

            {/* 2. Bell Ring */}
            <div
              onMouseEnter={() => play('pop')}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                <BellRingIcon size={20} />
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground block truncate">
                  BellRingIcon
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Vibración de campana
                </span>
              </div>
            </div>

            {/* 3. Search */}
            <div
              onMouseEnter={() => play('pop')}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                <SearchIcon size={20} />
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground block truncate">
                  SearchIcon
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Zoom cinético
                </span>
              </div>
            </div>

            {/* 4. Settings */}
            <div
              onMouseEnter={() => play('pop')}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                <SettingsIcon size={20} />
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground block truncate">
                  SettingsIcon
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Rotación de engranaje
                </span>
              </div>
            </div>

            {/* 5. Shield Check */}
            <div
              onMouseEnter={() => play('pop')}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                <ShieldCheckIcon size={20} />
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground block truncate">
                  ShieldCheckIcon
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Trazo de validación
                </span>
              </div>
            </div>

            {/* 6. Download */}
            <div
              onMouseEnter={() => play('pop')}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                <DownloadIcon size={20} />
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground block truncate">
                  DownloadIcon
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Rebote descendente
                </span>
              </div>
            </div>

            {/* 7. Refresh CW */}
            <div
              onMouseEnter={() => play('pop')}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                <RefreshCwIcon size={20} />
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground block truncate">
                  RefreshCwIcon
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Giro continuo 360°
                </span>
              </div>
            </div>

            {/* 8. Zap */}
            <div
              onMouseEnter={() => play('pop')}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                <ZapIcon size={20} />
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground block truncate">
                  ZapIcon
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Destello de energía
                </span>
              </div>
            </div>

            {/* 9. Credit Card */}
            <div
              onMouseEnter={() => play('pop')}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                <CreditCardIcon size={20} />
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground block truncate">
                  CreditCardIcon
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Deslizamiento de chip
                </span>
              </div>
            </div>

            {/* 10. Heart */}
            <div
              onMouseEnter={() => play('pop')}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                <HeartIcon size={20} />
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground block truncate">
                  HeartIcon
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Latido con resorte
                </span>
              </div>
            </div>

            {/* 11. Lock */}
            <div
              onMouseEnter={() => play('pop')}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                <LockIcon size={20} />
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground block truncate">
                  LockIcon
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Apertura de grillete
                </span>
              </div>
            </div>

            {/* 12. Compass */}
            <div
              onMouseEnter={() => play('pop')}
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors group cursor-pointer"
            >
              <div className="h-10 w-10 rounded-xl bg-background border border-border/50 flex items-center justify-center text-foreground group-hover:scale-105 transition-transform shadow-2xs shrink-0">
                <CompassIcon size={20} />
              </div>
              <div className="truncate">
                <span className="text-xs font-semibold text-foreground block truncate">
                  CompassIcon
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  Orientación magnética
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
