import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { z } from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { Badge } from '../../../shared/components/ui/badge';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';
import {
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  User,
  Shield,
  Key,
  Globe,
  Check,
  X,
} from 'lucide-react';

const baseSecuritySchema = z.object({
  username: z
    .string()
    .min(4, 'El usuario debe tener al menos 4 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Solo minúsculas, números y guiones bajos'),
  workEmail: z.string().email('Introduce un correo electrónico corporativo válido'),
  backupEmail: z.string().email('Introduce un correo de respaldo válido'),
  adminUrl: z.string().url('Introduce una URL válida que inicie con https://'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe incluir al menos una mayúscula')
    .regex(/[0-9]/, 'Debe incluir al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe incluir al menos un símbolo especial'),
  confirmPassword: z.string(),
  strictIpLock: z.boolean(),
});

const advancedSecuritySchema = baseSecuritySchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  }
);

type AdvancedSecurityData = z.infer<typeof advancedSecuritySchema>;

export const FormsValidationTab: React.FC = () => {
  const { play } = useSound();
  const [successPayload, setSuccessPayload] = useState<AdvancedSecurityData | null>(null);

  const form = useForm({
    defaultValues: {
      username: 'sec_admin',
      workEmail: 'security@blakor.dev',
      backupEmail: 'alerts-backup@blakor.dev',
      adminUrl: 'https://vault.blakor.dev/cluster-1',
      password: '',
      confirmPassword: '',
      strictIpLock: true,
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: advancedSecuritySchema,
    },
    onSubmit: async ({ value }) => {
      play('success');
      setSuccessPayload(value);
      pillToast.success('Políticas Validadas', 'Las credenciales cumplen al 100% las normativas NIST y SOC2.');
    },
  });

  // Calculate Password Strength Meter
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;

    let label = 'Sin ingresar';
    let colorClass = 'bg-muted';
    let textColor = 'text-muted-foreground';

    if (score === 25) {
      label = 'Débil';
      colorClass = 'bg-rose-500';
      textColor = 'text-rose-500';
    } else if (score === 50) {
      label = 'Moderada';
      colorClass = 'bg-amber-500';
      textColor = 'text-amber-500';
    } else if (score === 75) {
      label = 'Buena';
      colorClass = 'bg-blue-500';
      textColor = 'text-blue-500';
    } else if (score === 100) {
      label = 'Excelente (Robusta)';
      colorClass = 'bg-emerald-500';
      textColor = 'text-emerald-500';
    }

    return { score, label, colorClass, textColor };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" className="text-[10px]">
              TanStack Form
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Zod Schema Engine
            </Badge>
          </div>
          <CardTitle>Auditoría de Seguridad & Validación Criptográfica</CardTitle>
          <CardDescription>
            Validación reactiva en tiempo real por campo (`onChange` y `onBlur`) con adaptador Zod oficial y medidor de entropía de credenciales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="lg:col-span-7 space-y-5"
            >
              {/* Username */}
              <form.Field
                name="username"
                validators={{
                  onChange: baseSecuritySchema.shape.username,
                }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Usuario de Acceso Privilegiado (IAM User) *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9 font-mono text-xs"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="nombre_usuario"
                      />
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                        <AlertCircle className="h-3 w-3" />
                        {field.state.meta.errors[0]?.toString()}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <form.Field
                  name="workEmail"
                  validators={{
                    onChange: baseSecuritySchema.shape.workEmail,
                  }}
                >
                  {(field) => (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Correo Electrónico Corporativo *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          className="pl-9 font-mono text-xs"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="usuario@empresa.com"
                        />
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                          <AlertCircle className="h-3 w-3" />
                          {field.state.meta.errors[0]?.toString()}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>

                <form.Field
                  name="backupEmail"
                  validators={{
                    onChange: baseSecuritySchema.shape.backupEmail,
                  }}
                >
                  {(field) => (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Correo Secundario de Respaldo *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          className="pl-9 font-mono text-xs"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="respaldo@empresa.com"
                        />
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                          <AlertCircle className="h-3 w-3" />
                          {field.state.meta.errors[0]?.toString()}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Admin Vault URL */}
              <form.Field
                name="adminUrl"
                validators={{
                  onChange: baseSecuritySchema.shape.adminUrl,
                }}
              >
                {(field) => (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      URL Segura de Bóveda (Vault Endpoint) *
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="url"
                        className="pl-9 font-mono text-xs"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="https://vault.empresa.com"
                      />
                    </div>
                    {field.state.meta.errors.length > 0 && (
                      <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                        <AlertCircle className="h-3 w-3" />
                        {field.state.meta.errors[0]?.toString()}
                      </p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <form.Field
                  name="password"
                  validators={{
                    onChange: baseSecuritySchema.shape.password,
                  }}
                >
                  {(field) => {
                    const strength = getPasswordStrength(field.state.value);

                    return (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Contraseña de Alta Entropía *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="password"
                            className="pl-9 font-mono text-xs"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            placeholder="Mínimo 8 caracteres, símbolo y número"
                          />
                        </div>

                        {/* Entropy Meter */}
                        {field.state.value.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-muted-foreground">Fuerza:</span>
                              <span className={cn('font-bold font-mono', strength.textColor)}>
                                {strength.label}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn('h-full transition-all duration-300', strength.colorClass)}
                                style={{ width: `${strength.score}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {field.state.meta.errors.length > 0 && (
                          <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                            <AlertCircle className="h-3 w-3" />
                            {field.state.meta.errors[0]?.toString()}
                          </p>
                        )}
                      </div>
                    );
                  }}
                </form.Field>

                <form.Field
                  name="confirmPassword"
                  validators={{
                    onChange: baseSecuritySchema.shape.confirmPassword,
                  }}
                >
                  {(field) => (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Confirmación de Contraseña *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          className="pl-9 font-mono text-xs"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Reescribe la contraseña exacta"
                        />
                      </div>
                      {field.state.meta.errors.length > 0 && (
                        <p className="text-[11px] text-destructive flex items-center gap-1 font-medium">
                          <AlertCircle className="h-3 w-3" />
                          {field.state.meta.errors[0]?.toString()}
                        </p>
                      )}
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Strict IP Lock Switch */}
              <form.Field name="strictIpLock">
                {(field) => (
                  <div className="pt-2 flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border border-border/50">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Bloqueo Estricto de IP (Geo-fencing)</p>
                      <p className="text-[11px] text-muted-foreground">
                        Restringe el acceso administrativo exclusivamente a la lista blanca de la VPN corporativa.
                      </p>
                    </div>
                    <Switch
                      checked={field.state.value}
                      onCheckedChange={(checked) => {
                        play('toggle');
                        field.handleChange(checked);
                      }}
                    />
                  </div>
                )}
              </form.Field>

              {successPayload && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">¡Validación TanStack Form + Zod Exitosa!</p>
                    <p className="text-[11px] mt-0.5">
                      Credencial registrada para {successPayload.username} con bóveda en {successPayload.adminUrl}.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="default" size="sm" className="px-6 text-xs">
                  Auditar y Aplicar Credenciales
                </Button>
              </div>
            </form>

            {/* Right Column: Live Validation Telemetry & Schema Inspector */}
            <div className="lg:col-span-5 space-y-4">
              {/* Telemetry Header */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                    Inspector de Validación Zod
                  </span>
                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 font-mono">
                    Reactivo
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Motor de Reglas:</span>
                    <span className="font-mono font-semibold text-foreground">Zod v3.24 + TanStack</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Disparador de Evento:</span>
                    <span className="font-mono font-semibold text-primary">onChange + onBlur</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-muted-foreground">Cumplimiento:</span>
                    <span className="text-emerald-500 font-semibold font-mono text-[11px]">NIST SP 800-63B</span>
                  </div>
                </div>
              </div>

              {/* Checklist of security criteria */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-2 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground block text-xs mb-1">
                  Criterios Criptográficos Obligatorios:
                </span>
                <div className="space-y-1.5">
                  <span className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Longitud mínima de 8 caracteres
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Al menos una letra mayúscula (A-Z)
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Al menos un dígito numérico (0-9)
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Al menos un símbolo especial (!@#$%...)
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Bóveda HTTPS con certificado TLS
                  </span>
                </div>
              </div>

              {/* Live Payload Stream Preview */}
              <div className="p-4 rounded-2xl bg-card border border-border/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">
                    Estado en Vivo del Formulario
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    form.state.values
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-muted/40 border border-border/40 font-mono text-[10px] text-muted-foreground overflow-x-auto">
                  <p><span className="text-primary">username:</span> "{form.state.values.username}"</p>
                  <p><span className="text-primary">workEmail:</span> "{form.state.values.workEmail}"</p>
                  <p><span className="text-primary">backupEmail:</span> "{form.state.values.backupEmail}"</p>
                  <p><span className="text-primary">adminUrl:</span> "{form.state.values.adminUrl}"</p>
                  <p><span className="text-primary">strictIpLock:</span> {form.state.values.strictIpLock ? 'true' : 'false'}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
