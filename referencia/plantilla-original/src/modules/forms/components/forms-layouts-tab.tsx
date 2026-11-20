import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { Badge } from '../../../shared/components/ui/badge';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { countryOptions, industryOptions } from '../data/forms-data';
import {
  Building2,
  Mail,
  User,
  Phone,
  MapPin,
  Globe,
  Key,
  ShieldCheck,
  Send,
  RotateCcw,
} from 'lucide-react';

export const FormsLayoutsTab: React.FC = () => {
  const { play } = useSound();

  // Standard Form State
  const [standardForm, setStandardForm] = useState({
    fullName: 'Javier Morales',
    email: 'javier.morales@empresa.com',
    industry: 'saas',
    bio: 'Administrador principal del clúster de producción en US-East.',
  });

  // Grid Form State
  const [gridForm, setGridForm] = useState({
    legalName: 'Blakor Cloud Solutions S.A.C.',
    taxId: '20608912345',
    address: 'Av. Las Begonias 441, Piso 12',
    city: 'Lima',
    postalCode: '15046',
    country: 'PE',
    contactPerson: 'Valeria Castro',
    contactPhone: '987654321',
  });

  // Horizontal Form State
  const [horizontalForm, setHorizontalForm] = useState({
    webhookUrl: 'https://api.empresa.com/v1/webhooks/blakor-audit',
    hmacKey: 'whsec_8f9104b92c81a5e12891bb3',
    payloadFormat: 'json',
    immediateDispatch: true,
  });

  const handleStandardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    play('success');
    pillToast.success('Perfil Guardado', 'Los datos del responsable corporativo fueron actualizados.');
  };

  const handleGridSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    play('success');
    pillToast.success('Ficha Fiscal Registrada', 'La información de facturación fue almacenada en el clúster.');
  };

  const handleHorizontalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    play('success');
    pillToast.success('Webhook Configurado', 'Endpoint verificado contra firma HMAC SHA-256.');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Formulario Estándar Vertical */}
      <Card>
        <CardHeader>
          <CardTitle>Formulario Estándar Vertical</CardTitle>
          <CardDescription>
            Estructura vertical limpia adaptada de Modernize para edición de perfiles individuales y configuraciones centrales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form onSubmit={handleStandardSubmit} className="lg:col-span-7 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Nombre y Apellidos
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={standardForm.fullName}
                    onChange={(e) => setStandardForm({ ...standardForm, fullName: e.target.value })}
                    placeholder="Introduce el nombre completo"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Correo Electrónico Corporativo
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    className="pl-9 font-mono text-xs"
                    value={standardForm.email}
                    onChange={(e) => setStandardForm({ ...standardForm, email: e.target.value })}
                    placeholder="correo@corporacion.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Sector o Industria
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={standardForm.industry}
                    onChange={(e) => setStandardForm({ ...standardForm, industry: e.target.value })}
                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-input bg-background/50 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                  >
                    {industryOptions.map((ind) => (
                      <option key={ind.id} value={ind.id}>
                        {ind.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-foreground">
                    Notas de Perfil o Resumen
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                    {standardForm.bio.length} / 250 caracteres
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={250}
                  value={standardForm.bio}
                  onChange={(e) => setStandardForm({ ...standardForm, bio: e.target.value })}
                  className="w-full p-3 rounded-xl border border-input bg-background/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Describe brevemente las responsabilidades del titular..."
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    play('click');
                    setStandardForm({
                      fullName: '',
                      email: '',
                      industry: 'saas',
                      bio: '',
                    });
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  <span>Restablecer</span>
                </Button>
                <Button type="submit" variant="default" size="sm" className="px-5">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  <span>Guardar Cambios</span>
                </Button>
              </div>
            </form>

            {/* Live Profile Card on Right to balance layout */}
            <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-2xl bg-muted/20 border border-border/50">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                    Ficha de Vista Previa
                  </span>
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500 bg-emerald-500/5 font-mono">
                    En Tiempo Real
                  </Badge>
                </div>

                <div className="flex items-center gap-3.5 pt-1">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-base shrink-0">
                    {standardForm.fullName ? standardForm.fullName.slice(0, 2).toUpperCase() : 'JM'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate">
                      {standardForm.fullName || 'Sin nombre registrado'}
                    </h4>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {standardForm.email || 'correo@ejemplo.com'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-background/60 border border-border/50 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Industria:</span>
                    <span className="font-semibold text-foreground uppercase tracking-wider font-mono text-[10px]">
                      {industryOptions.find((i) => i.id === standardForm.industry)?.label || standardForm.industry}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-muted-foreground">Estado de Cuenta:</span>
                    <span className="text-emerald-500 font-semibold font-mono text-[10px]">Verificado SOC2</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-foreground">Extracto de Bio:</span>
                  <p className="text-xs text-muted-foreground leading-relaxed italic line-clamp-3">
                    "{standardForm.bio || 'Sin biografía añadida.'}"
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/40 text-[10px] text-muted-foreground font-mono flex items-center justify-between">
                <span>ID: US-EAST-CL1</span>
                <span>Actualización instantánea</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Formulario de Cuadrícula (2 Columnas) */}
      <Card>
        <CardHeader>
          <CardTitle>Registro Fiscal & Facturación (Grid 2 Columnas)</CardTitle>
          <CardDescription>
            Distribución balanceada en dos columnas para agrupar campos fiscales, ubicación y teléfonos de contacto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGridSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Razón Social / Entidad Legal *
                </label>
                <Input
                  value={gridForm.legalName}
                  onChange={(e) => setGridForm({ ...gridForm, legalName: e.target.value })}
                  placeholder="Ej. Acme Technologies LLC"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Identificador Fiscal (RUC / CIF / Tax ID) *
                </label>
                <Input
                  className="font-mono text-xs"
                  value={gridForm.taxId}
                  onChange={(e) => setGridForm({ ...gridForm, taxId: e.target.value })}
                  placeholder="20608912345"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">
                  Dirección Fiscal Registrada *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={gridForm.address}
                    onChange={(e) => setGridForm({ ...gridForm, address: e.target.value })}
                    placeholder="Calle, número, oficina o suite"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Ciudad
                </label>
                <Input
                  value={gridForm.city}
                  onChange={(e) => setGridForm({ ...gridForm, city: e.target.value })}
                  placeholder="Lima"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Código Postal
                </label>
                <Input
                  className="font-mono text-xs"
                  value={gridForm.postalCode}
                  onChange={(e) => setGridForm({ ...gridForm, postalCode: e.target.value })}
                  placeholder="15046"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  País de Facturación
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={gridForm.country}
                    onChange={(e) => setGridForm({ ...gridForm, country: e.target.value })}
                    className="w-full h-9 pl-9 pr-3 rounded-xl border border-input bg-background/50 text-xs font-medium text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                  >
                    {countryOptions.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.dialCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Teléfono de Contacto Fiscal
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 font-mono text-xs tabular-nums"
                    value={gridForm.contactPhone}
                    onChange={(e) => setGridForm({ ...gridForm, contactPhone: e.target.value })}
                    placeholder="987654321"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/40">
              <Button type="submit" variant="default" size="sm" className="px-6">
                Guardar Ficha Fiscal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 3. Formulario Horizontal */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Webhooks (Diseño Horizontal)</CardTitle>
          <CardDescription>
            Las etiquetas se alinean a la izquierda en pantallas medianas y grandes para un orden visual técnico y estricto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleHorizontalSubmit} className="space-y-5">
            {/* Endpoint URL */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <label className="text-xs font-semibold text-foreground sm:w-1/3">
                URL del Endpoint HTTPS *
              </label>
              <div className="sm:w-2/3">
                <Input
                  className="font-mono text-xs"
                  value={horizontalForm.webhookUrl}
                  onChange={(e) => setHorizontalForm({ ...horizontalForm, webhookUrl: e.target.value })}
                  placeholder="https://su-dominio.com/webhook"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Se requiere un certificado TLS válido para aceptar peticiones POST entrantes.
                </p>
              </div>
            </div>

            {/* HMAC Key */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <label className="text-xs font-semibold text-foreground sm:w-1/3">
                Clave de Firma Secreta
              </label>
              <div className="sm:w-2/3 relative">
                <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  readOnly
                  className="pl-9 font-mono text-xs bg-muted/40 cursor-text"
                  value={horizontalForm.hmacKey}
                />
              </div>
            </div>

            {/* Payload Format */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <label className="text-xs font-semibold text-foreground sm:w-1/3">
                Formato de Serialización
              </label>
              <div className="sm:w-2/3 flex items-center gap-3">
                {['json', 'avro', 'protobuf'].map((fmt) => (
                  <label key={fmt} className="flex items-center gap-1.5 text-xs font-mono uppercase cursor-pointer">
                    <input
                      type="radio"
                      name="payloadFormat"
                      checked={horizontalForm.payloadFormat === fmt}
                      onChange={() => {
                        play('click');
                        setHorizontalForm({ ...horizontalForm, payloadFormat: fmt });
                      }}
                      className="accent-primary h-3.5 w-3.5"
                    />
                    <span>{fmt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Immediate Dispatch Switch */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-6 pt-3 border-t border-border/40">
              <div className="sm:w-2/3">
                <p className="text-xs font-semibold text-foreground">Despacho Inmediato sin Cola</p>
                <p className="text-[11px] text-muted-foreground">
                  Omite el búfer de Kafka para entregar eventos críticos en menos de 50ms.
                </p>
              </div>
              <Switch
                checked={horizontalForm.immediateDispatch}
                onCheckedChange={(checked) => {
                  play('toggle');
                  setHorizontalForm({ ...horizontalForm, immediateDispatch: checked });
                }}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="default" size="sm" className="px-6">
                <Send className="h-3.5 w-3.5 mr-1.5" />
                <span>Aplicar Configuración</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
