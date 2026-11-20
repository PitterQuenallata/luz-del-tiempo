import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { Badge } from '../../../shared/components/ui/badge';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';
import { UploadedFileItem } from '../types/forms.types';
import { FileUploadDemo } from '@/components/ui/file-upload-card';
import {
  UploadCloud,
  FileText,
  Trash2,
  Check,
  Search,
  ExternalLink,
  DollarSign,
  Percent,
  Sliders,
  Shield,
  Zap,
  Server,
  Cloud,
} from 'lucide-react';

export const FormsElementsTab: React.FC = () => {
  const { play } = useSound();

  // Input Groups
  const [subdomain, setSubdomain] = useState('acme-corp');
  const [amount, setAmount] = useState('2400.00');
  const [discountPercent, setDiscountPercent] = useState('15');

  // Card Radios
  const [environment, setEnvironment] = useState<'cloud' | 'hybrid' | 'onpremise'>('cloud');

  // Checkbox group
  const [permissions, setPermissions] = useState<string[]>(['read', 'write']);

  // Slider State
  const [cpuUnits, setCpuUnits] = useState(4);
  const [memoryGb, setMemoryGb] = useState(16);

  // File Upload State
  const [files, setFiles] = useState<UploadedFileItem[]>([
    {
      id: 'f-1',
      name: 'Certificado_SSL_Wildcard_2026.pem',
      size: 4210,
      type: 'application/x-pem-file',
      progress: 100,
      status: 'completed',
    },
    {
      id: 'f-2',
      name: 'Informe_Cumplimiento_SOC2.pdf',
      size: 1048576 * 2.4, // 2.4 MB
      type: 'application/pdf',
      progress: 100,
      status: 'completed',
    },
  ]);

  const togglePermission = (perm: string) => {
    play('click');
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleDeleteFile = (id: string, name: string) => {
    play('alert');
    setFiles((prev) => prev.filter((f) => f.id !== id));
    pillToast.info('Archivo Eliminado', `${name} fue retirado de la cola de subida.`);
  };

  const handleSimulateUpload = () => {
    play('pop');
    const newId = `f-${Date.now()}`;
    const newFile: UploadedFileItem = {
      id: newId,
      name: `Auditoria_Configuracion_${Date.now().toString().slice(-4)}.json`,
      size: 512000,
      type: 'application/json',
      progress: 100,
      status: 'completed',
    };
    setFiles((prev) => [newFile, ...prev]);
    pillToast.success('Archivo Cargado', `${newFile.name} se verificó con SHA-256.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Grupos de Entrada (Input Groups) */}
      <Card>
        <CardHeader>
          <CardTitle>Grupos de Entrada (Input Groups & Add-ons)</CardTitle>
          <CardDescription>
            Controles de texto enriquecidos con prefijos, sufijos fijos, botones y selectores integrados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subdomain Input Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Subdominio Corporativo de la Plataforma
              </label>
              <div className="flex rounded-xl border border-input bg-background/50 overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                <span className="px-3 py-2 bg-muted/60 text-muted-foreground text-xs font-mono border-r border-input select-none">
                  https://
                </span>
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  className="flex-1 px-3 py-2 bg-transparent text-xs font-mono text-foreground focus:outline-hidden"
                  placeholder="su-empresa"
                />
                <span className="px-3 py-2 bg-muted/60 text-muted-foreground text-xs font-mono border-l border-input select-none">
                  .blakor.dev
                </span>
              </div>
            </div>

            {/* Currency Input Group */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Cuota Mensual Presupuestada
              </label>
              <div className="flex rounded-xl border border-input bg-background/50 overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                <span className="px-3 py-2 bg-muted/60 text-muted-foreground text-xs font-mono border-r border-input flex items-center select-none">
                  <DollarSign className="h-3.5 w-3.5 mr-0.5" /> USD
                </span>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 px-3 py-2 bg-transparent text-xs font-mono tabular-nums text-foreground focus:outline-hidden"
                  placeholder="0.00"
                />
                <span className="px-3 py-2 bg-muted/60 text-muted-foreground text-xs font-mono border-l border-input select-none">
                  / mes
                </span>
              </div>
            </div>

            {/* Discount Percentage */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Tasa de Descuento por Volumen
              </label>
              <div className="flex rounded-xl border border-input bg-background/50 overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="flex-1 px-3 py-2 bg-transparent text-xs font-mono tabular-nums text-foreground focus:outline-hidden"
                />
                <span className="px-3 py-2 bg-muted/60 text-muted-foreground text-xs font-mono border-l border-input flex items-center select-none">
                  <Percent className="h-3 w-3 mr-0.5" />
                </span>
              </div>
            </div>

            {/* Search with Action Button */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Búsqueda Rápida de Clientes
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar por ID o RUC..." className="pl-9 font-mono text-xs" />
                </div>
                <Button variant="default" size="sm" onClick={() => play('click')} className="px-4">
                  Consultar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Card Radios (Selección Estilo Tarjeta) */}
      <Card>
        <CardHeader>
          <CardTitle>Card Radios (Selección Visual de Entornos)</CardTitle>
          <CardDescription>
            Tarjetas interactivas con estado seleccionado de alto contraste y retroalimentación táctil de Apple.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                id: 'cloud',
                title: 'Cloud Gestionado',
                desc: 'Despliegue multi-zona en clústeres AWS y Google Cloud con auto-escalado.',
                icon: Cloud,
                badge: 'Recomendado',
              },
              {
                id: 'hybrid',
                title: 'Nube Híbrida',
                desc: 'Controlador en la nube con nodos de procesamiento locales on-premise.',
                icon: Zap,
              },
              {
                id: 'onpremise',
                title: 'Aislamiento On-Premise',
                desc: 'Despliegue 100% aireado (air-gapped) en servidores físicos privados.',
                icon: Server,
              },
            ].map((opt) => {
              const Icon = opt.icon;
              const isSelected = environment === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => {
                    play('click');
                    setEnvironment(opt.id as any);
                  }}
                  className={cn(
                    'p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 relative group flex flex-col justify-between',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20'
                      : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={cn(
                          'h-9 w-9 rounded-xl flex items-center justify-center transition-colors',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground group-hover:text-foreground'
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      {opt.badge && (
                        <Badge variant="default" className="text-[10px] py-0 px-1.5">
                          {opt.badge}
                        </Badge>
                      )}
                    </div>
                    <h4 className={cn('text-xs font-semibold mb-1', isSelected ? 'text-primary' : 'text-foreground')}>
                      {opt.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {opt.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-muted-foreground">Arquitectura</span>
                    <span className="font-semibold text-foreground">
                      {isSelected ? 'Activo' : 'Seleccionar'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. Checkboxes & Switches Especializados */}
      <Card>
        <CardHeader>
          <CardTitle>Permisos & Switches de Sistema</CardTitle>
          <CardDescription>
            Controles booleanos y multi-selección con validaciones y descripciones de alcance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Checkbox Group */}
            <div className="space-y-2 p-4 rounded-2xl bg-muted/20 border border-border/50">
              <span className="text-xs font-semibold text-foreground block mb-2">
                Permisos del Token de API
              </span>
              {[
                { id: 'read', label: 'Lectura de Registros (GET)', desc: 'Permite consultar logs, clientes y facturas.' },
                { id: 'write', label: 'Escritura & Mutación (POST/PUT)', desc: 'Habilita emisión de licencias y cobros.' },
                { id: 'delete', label: 'Revocación & Borrado (DELETE)', desc: 'Permite retirar accesos y eliminar recursos.' },
              ].map((p) => {
                const checked = permissions.includes(p.id);
                return (
                  <label
                    key={p.id}
                    onClick={() => togglePermission(p.id)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="mt-0.5 accent-primary h-4 w-4 rounded-md cursor-pointer"
                    />
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-tight">{p.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{p.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Range Sliders */}
            <div className="space-y-4 p-4 rounded-2xl bg-muted/20 border border-border/50">
              <span className="text-xs font-semibold text-foreground block mb-1">
                Dimensionamiento de Cómputo Dedicado
              </span>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Núcleos vCPU:</span>
                  <span className="font-mono font-bold text-primary tabular-nums">{cpuUnits} vCPUs</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="32"
                  value={cpuUnits}
                  onChange={(e) => {
                    play('click');
                    setCpuUnits(parseInt(e.target.value));
                  }}
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Memoria RAM Asignada:</span>
                  <span className="font-mono font-bold text-primary tabular-nums">{memoryGb} GB RAM</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="128"
                  step="4"
                  value={memoryGb}
                  onChange={(e) => {
                    play('click');
                    setMemoryGb(parseInt(e.target.value));
                  }}
                  className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-background border border-border/60 text-[11px] text-muted-foreground flex justify-between">
                <span>Estimación Mensual:</span>
                <span className="font-mono font-semibold text-foreground tabular-nums">
                  ${(cpuUnits * 14.5 + memoryGb * 4.2).toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Subida de Archivos Drag & Drop (Dropzone) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Carga de Documentos Criptográficos & Certificados</CardTitle>
            <CardDescription>
              Zona interactiva de subida con verificación de firma y lista de archivos adjuntos.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleSimulateUpload} className="text-xs">
            <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
            <span>Simular Subida</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dropzone Area */}
          <div
            onClick={handleSimulateUpload}
            className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-3xl p-8 text-center bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer flex flex-col items-center justify-center group"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud className="h-6 w-6 stroke-[1.75px]" />
            </div>
            <p className="text-xs font-semibold text-foreground mb-1">
              Arrastra archivos aquí o haz clic para explorar tu ordenador
            </p>
            <p className="text-[11px] text-muted-foreground">
              Formatos soportados: PEM, CRT, KEY, PDF, JSON hasta un máximo de 25 MB por archivo
            </p>
          </div>

          {/* Uploaded Files List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-foreground">
              Archivos Verificados ({files.length})
            </span>
            <div className="divide-y divide-border/40 rounded-2xl border border-border/60 overflow-hidden bg-card/50">
              {files.map((file) => (
                <div key={file.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
                        {(file.size / 1024).toFixed(1)} KB &bull; Estado: Verificado
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/5 font-mono">
                      Cifrado AES-256
                    </Badge>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      onClick={() => handleDeleteFile(file.id, file.name)}
                      title="Eliminar archivo"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5. Animated FileUploadCard (Drag & Drop con Barra de Progreso) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" className="text-[10px]">
              Framer Motion
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Upload Card Suite
            </Badge>
          </div>
          <CardTitle>FileUploadCard (Zona de Carga con Estado y Progreso en Tiempo Real)</CardTitle>
          <CardDescription>
            Tarjeta interactiva con drag & drop nativo, cálculo de peso de archivo dinámico, progreso de carga simulado y transiciones fluidas.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6 bg-muted/10 rounded-2xl">
          <FileUploadDemo className="p-0" />
        </CardContent>
      </Card>
    </div>
  );
};
