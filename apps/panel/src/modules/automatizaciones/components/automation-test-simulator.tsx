import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  Zap,
  Clock,
  ArrowRight,
  RotateCcw,
  Code2,
} from 'lucide-react';
import { AutomationRule } from '../types/automatizaciones.types';
import { Button } from '../../../../src/shared/components/ui/button';
import { Badge } from '../../../../src/shared/components/ui/badge';
import { useSound } from '../../../../src/shared/context/sound-context';
import { pillToast } from '../../../../src/shared/components/ui/pill-toast';
import { IOSSpinner } from '../../../../src/components/ui/ios-spinner';
import { cn } from '../../../../src/shared/lib/utils';

interface AutomationTestSimulatorProps {
  rule: AutomationRule | null;
  onClose: () => void;
}

export const AutomationTestSimulator: React.FC<AutomationTestSimulatorProps> = ({
  rule,
  onClose,
}) => {
  const { play } = useSound();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionTime, setExecutionTime] = useState<number>(0);

  const startSimulation = () => {
    setIsRunning(true);
    setCurrentStep(1);
    setExecutionTime(0);
    play('click');

    // Step 1: Trigger evaluation
    setTimeout(() => {
      setCurrentStep(2);
      play('pop');
    }, 900);

    // Step 2: Condition check
    setTimeout(() => {
      setCurrentStep(3);
      play('pop');
    }, 1800);

    // Step 3: Action completed
    setTimeout(() => {
      setCurrentStep(4);
      setIsRunning(false);
      setExecutionTime(Math.floor(Math.random() * 80) + 110);
      play('pop');
      pillToast.success(
        `Flujo ejecutado con éxito`,
        `Regla "${rule?.name}" procesada en ${rule?.avgLatency}`
      );
    }, 2700);
  };

  useEffect(() => {
    if (rule) {
      startSimulation();
    }
  }, [rule]);

  if (!rule) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
        onClick={() => {
          play('click');
          onClose();
        }}
      />

      {/* Simulator Modal Card */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/20 dark:border-white/10 bg-card/95 dark:bg-[#1C1C1E]/95 backdrop-blur-3xl shadow-2xl p-6 text-foreground z-50 space-y-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">
                Simulador en Vivo
              </span>
              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                Test Sandbox
              </Badge>
            </div>
            <h3 className="text-lg font-bold tracking-tight text-foreground mt-1">
              {rule.name}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => {
              play('click');
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Pipeline Step Progress */}
        <div className="space-y-4">
          {/* Step 1: Trigger Evaluation */}
          <div
            className={cn(
              'p-3.5 rounded-xl border transition-all flex items-center justify-between',
              currentStep >= 1
                ? 'border-border/80 bg-background/60'
                : 'border-border/30 opacity-40 bg-muted/10'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold font-mono',
                  currentStep > 1
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : currentStep === 1
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {currentStep > 1 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : currentStep === 1 ? (
                  <IOSSpinner size="sm" />
                ) : (
                  '1'
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  1. Evaluación del Disparador
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {rule.trigger.title} ({rule.trigger.service})
                </p>
              </div>
            </div>
            {currentStep > 1 && (
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Aprobado
              </span>
            )}
          </div>

          {/* Step 2: Condition Check */}
          <div
            className={cn(
              'p-3.5 rounded-xl border transition-all flex items-center justify-between',
              currentStep >= 2
                ? 'border-border/80 bg-background/60'
                : 'border-border/30 opacity-40 bg-muted/10'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold font-mono',
                  currentStep > 2
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : currentStep === 2
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {currentStep > 2 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : currentStep === 2 ? (
                  <IOSSpinner size="sm" />
                ) : (
                  '2'
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  2. Validación de Reglas de Negocio
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {rule.condition.title}
                </p>
              </div>
            </div>
            {currentStep > 2 && (
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Cumplida
              </span>
            )}
          </div>

          {/* Step 3: Action Execution */}
          <div
            className={cn(
              'p-3.5 rounded-xl border transition-all flex items-center justify-between',
              currentStep >= 3
                ? 'border-border/80 bg-background/60'
                : 'border-border/30 opacity-40 bg-muted/10'
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold font-mono',
                  currentStep > 3
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    : currentStep === 3
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {currentStep > 3 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : currentStep === 3 ? (
                  <IOSSpinner size="sm" />
                ) : (
                  '3'
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  3. Ejecución de Acción Automatizada
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {rule.action.title}
                </p>
              </div>
            </div>
            {currentStep > 3 && (
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                Completada
              </span>
            )}
          </div>
        </div>

        {/* Live Diagnostic Payload */}
        {currentStep === 4 && (
          <div className="p-3.5 rounded-xl border border-border/50 bg-background/80 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span>Estado HTTP: 200 OK</span>
              <span className="tabular-nums">Tiempo total: {executionTime}ms</span>
            </div>
            <pre className="overflow-x-auto text-[10px] font-mono text-foreground/90 p-2 rounded bg-muted/40">
              {JSON.stringify(
                {
                  ruleId: rule.id,
                  event: rule.trigger.subtitle,
                  dispatchedTo: rule.action.service,
                  status: 'SUCCESS',
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              )}
            </pre>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={startSimulation}
            disabled={isRunning}
            className="text-xs rounded-xl gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Volver a probar</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() => {
              play('click');
              onClose();
            }}
            className="text-xs rounded-xl"
          >
            Finalizar prueba
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AutomationTestSimulator;
