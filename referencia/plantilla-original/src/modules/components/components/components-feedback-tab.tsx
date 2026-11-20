import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Badge } from '../../../shared/components/ui/badge';
import { Button } from '../../../shared/components/ui/button';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';
import {
  ChevronDown,
  Inbox,
  RefreshCw,
  Info,
  HelpCircle,
  Sparkles,
  Layers,
  Search,
  CheckCircle2,
  FileQuestion,
} from 'lucide-react';

export const ComponentsFeedbackTab: React.FC = () => {
  const { play } = useSound();
  const [openAccordion, setOpenAccordion] = useState<string | null>('acc-1');
  const [isLoadingSkeleton, setIsLoadingSkeleton] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const toggleAccordion = (id: string) => {
    play('click');
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  const handleSimulateLoading = () => {
    play('pop');
    setIsLoadingSkeleton(true);
    setTimeout(() => {
      setIsLoadingSkeleton(false);
      play('success');
      pillToast.success('Carga Completada', 'Los datos del nodo fueron rehidratados.');
    }, 2000);
  };

  const accordionItems = [
    {
      id: 'acc-1',
      title: '¿Cómo garantiza el sistema la compatibilidad con Apple Human Interface Guidelines?',
      content:
        'Cada componente está calibrado con tipografía SF Pro en escalas oficiales, cifras numéricas tabulares monoespaciadas, micro-bordes sutiles de 1px con canal alfa y ausencia absoluta de emojis para preservar el rigor corporativo.',
    },
    {
      id: 'acc-2',
      title: '¿Qué ventaja aporta la integración de TanStack Router y TanStack Table?',
      content:
        'Ofrece seguridad de tipos completa (Type-Safe) en tiempo de compilación, gestión reactiva de parámetros en URL sin desincronización de estado y un motor de tablas headless optimizado para manejar miles de filas sin caídas de framerate.',
    },
    {
      id: 'acc-3',
      title: '¿Cómo funciona la capa de materiales Liquid Glass?',
      content:
        'Utiliza filtros CSS avanzados de backdrop-filter con desenfoque de 24px y saturación dinámica del 180%, permitiendo que el contenido fluya debajo de los controles de navegación sin perder legibilidad.',
    },
    {
      id: 'acc-4',
      title: '¿Cuál es la política de accesibilidad y contraste cromático (WCAG 2.1 AA)?',
      content:
        'Todos los controles cuentan con atributos ARIA nativos, foco visible de alto contraste mediante anillos de enfoque de 2px y ratios de contraste mínimos de 4.5:1 tanto en modo claro como en modo oscuro.',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Accordions Apple de Expansión Fluida */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" className="text-[10px]">
              Expansión Fluida
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Apple HIG
            </Badge>
          </div>
          <CardTitle>Acordeones Apple de Expansión Fluida</CardTitle>
          <CardDescription>
            Paneles plegables con rotación de chevron y animaciones sin saltos de maquetación para preguntas frecuentes y contenido estructurado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {accordionItems.map((item) => {
            const isOpen = openAccordion === item.id;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border/50 overflow-hidden bg-muted/20 transition-colors hover:bg-muted/30"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full flex items-center justify-between p-4 text-left cursor-pointer transition-colors"
                >
                  <span className="text-xs font-semibold text-foreground">{item.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0 ml-3',
                      isOpen && 'rotate-180 text-primary'
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed animate-in fade-in">
                    {item.content}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 2. Estados Vacíos & Placeholders (Empty State Feedback) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado Vacío (Empty State • Sin Tareas)</CardTitle>
            <CardDescription>
              Feedback visual de cortesía cuando no existen registros o tareas pendientes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-8 rounded-2xl border border-dashed border-border/70 flex flex-col items-center justify-center text-center bg-muted/10 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center text-muted-foreground">
                <Inbox className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">Bandeja de Operaciones al Día</h4>
                <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                  No hay incidentes ni solicitudes pendientes de revisión. Todos los eventos fueron procesados.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  play('click');
                  pillToast.info('Bandeja Actualizada', 'Verificación completada: 0 pendientes.');
                }}
                className="text-xs gap-1.5 h-8 mt-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Comprobar Nuevos Eventos</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 3. Empty Search Filter State */}
        <Card>
          <CardHeader>
            <CardTitle>Estado Vacío (Sin Resultados de Filtro)</CardTitle>
            <CardDescription>
              Feedback visual guiado cuando una consulta de búsqueda no arroja coincidencias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-8 rounded-2xl border border-dashed border-border/70 flex flex-col items-center justify-center text-center bg-muted/10 space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <Search className="h-6 w-6 stroke-[1.5]" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-foreground">Sin Coincidencias de Búsqueda</h4>
                <p className="text-[11px] text-muted-foreground max-w-xs leading-relaxed">
                  No encontramos registros para el criterio ingresado. Prueba ajustando los términos o limpiando los filtros.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  play('click');
                  pillToast.info('Filtros Restablecidos', 'Mostrando todos los registros del directorio.');
                }}
                className="text-xs gap-1.5 h-8 mt-1"
              >
                <span>Limpiar Filtros</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Esqueletos de Carga Shimmer (Skeleton Feedback Primitives) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle>Esqueletos de Carga Shimmer (Skeleton Loaders)</CardTitle>
              <CardDescription>
                Primitivas de carga progresiva que previenen desplazamientos acumulados de diseño (CLS).
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={isLoadingSkeleton}
              onClick={handleSimulateLoading}
              className="text-xs gap-1.5 h-8"
            >
              <RefreshCw className={cn('h-3 w-3', isLoadingSkeleton && 'animate-spin')} />
              <span>Simular Carga (2s)</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="p-5 rounded-2xl border border-border/60 bg-muted/10">
            {isLoadingSkeleton ? (
              <div className="space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-muted/60" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3.5 bg-muted/60 rounded-md w-1/3" />
                    <div className="h-2.5 bg-muted/40 rounded-md w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-border/30">
                  <div className="h-2.5 bg-muted/50 rounded-md w-full" />
                  <div className="h-2.5 bg-muted/50 rounded-md w-5/6" />
                  <div className="h-2.5 bg-muted/40 rounded-md w-2/3" />
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center font-bold font-mono text-xs">
                    SSL
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Certificado Wildcard *.blakor.dev</h4>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      Emisor: DigiCert Global Root G2 • RSA 4096 bits
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t border-border/30 leading-relaxed">
                  Cifrado de grado bancario activo en todos los endpoints HTTP/2 y HTTP/3. Renovación automática programada con antelación de 30 días.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
