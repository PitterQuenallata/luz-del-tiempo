import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Switch } from '../../../shared/components/ui/switch';
import { Badge } from '../../../shared/components/ui/badge';
import { useSound } from '../../../shared/context/sound-context';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { cn } from '../../../shared/lib/utils';
import { wizardPlans, countryOptions } from '../data/forms-data';
import { WizardFormData } from '../types/forms.types';
import {
  KeyRound,
  Building2,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Shield,
  User,
  Mail,
  Lock,
  Phone,
  Globe,
  Sparkles,
  Server,
  Zap,
} from 'lucide-react';

export const FormsWizardTab: React.FC = () => {
  const { play } = useSound();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const [wizardData, setWizardData] = useState<WizardFormData>({
    accountEmail: 'admin@acme-cloud.io',
    accountUsername: 'acme_sysadmin',
    accountRole: 'Super Admin',
    password: 'superSecretPassword2026!',
    confirmPassword: 'superSecretPassword2026!',
    twoFactorEnabled: true,

    companyName: 'Acme Cloud Technologies Inc.',
    taxId: 'US-948102910',
    contactName: 'Carlos Santillán',
    contactPhone: '+1 (555) 392-1092',
    country: 'US',
    billingAddress: '440 Montgomery St, Suite 800, San Francisco, CA',

    selectedPlan: 'pro',
    billingCycle: 'annual',
    seatsCount: 25,
    dedicatedIp: true,

    acceptedTerms: true,
    slaNotificationEmail: 'ops-alerts@acme-cloud.io',
  });

  const [isCompleted, setIsCompleted] = useState(false);

  const handleNext = () => {
    // Basic validation before moving next
    if (currentStep === 1) {
      if (!wizardData.accountEmail || !wizardData.accountUsername || !wizardData.password) {
        play('alert');
        pillToast.error('Campos Requeridos', 'Completa el correo y contraseña antes de continuar.');
        return;
      }
      if (wizardData.password !== wizardData.confirmPassword) {
        play('alert');
        pillToast.error('Contraseñas no coinciden', 'Verifica que ambas contraseñas sean idénticas.');
        return;
      }
    }

    if (currentStep === 2) {
      if (!wizardData.companyName || !wizardData.taxId) {
        play('alert');
        pillToast.error('Datos Faltantes', 'Ingresa la razón social y el identificador fiscal.');
        return;
      }
    }

    play('click');
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    play('click');
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  const handleFinish = () => {
    if (!wizardData.acceptedTerms) {
      play('alert');
      pillToast.error('Términos no aceptados', 'Debes aceptar los términos del acuerdo de nivel de servicio (SLA).');
      return;
    }
    play('success');
    setIsCompleted(true);
    pillToast.success('Onboarding Completado', 'La cuenta corporativa y los nodos cloud fueron aprovisionados.');
  };

  const stepsMeta = [
    { number: 1, title: 'Cuenta & Seguridad', icon: KeyRound, desc: 'Credenciales del titular' },
    { number: 2, title: 'Perfil Corporativo', icon: Building2, desc: 'Razón social y fiscal' },
    { number: 3, title: 'Plan & Cuotas', icon: CreditCard, desc: 'Capacidad de clúster' },
    { number: 4, title: 'Resumen & Activación', icon: CheckCircle2, desc: 'Firma de acuerdo' },
  ];

  const selectedPlanDetails = wizardPlans.find((p) => p.id === wizardData.selectedPlan) || wizardPlans[1];
  const monthlyCost =
    wizardData.billingCycle === 'annual'
      ? selectedPlanDetails.priceAnnual
      : selectedPlanDetails.priceMonthly;
  const totalCost = monthlyCost * wizardData.seatsCount + (wizardData.dedicatedIp ? 45 : 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Stepper Bar */}
      <div className="p-4 sm:p-6 rounded-3xl bg-card border border-border/60 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
          {stepsMeta.map((s) => {
            const isDone = currentStep > s.number;
            const isCurrent = currentStep === s.number;

            return (
              <div
                key={s.number}
                onClick={() => {
                  if (s.number < currentStep) {
                    play('click');
                    setCurrentStep(s.number as any);
                  }
                }}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-2xl transition-all',
                  s.number < currentStep && 'cursor-pointer hover:bg-muted/40',
                  isCurrent && 'bg-primary/10 ring-1 ring-primary/30'
                )}
              >
                <div
                  className={cn(
                    'h-9 w-9 rounded-xl flex items-center justify-center font-mono text-xs font-bold shrink-0 transition-colors',
                    isDone && 'bg-emerald-500 text-white',
                    isCurrent && 'bg-primary text-primary-foreground shadow-xs',
                    !isDone && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.number}
                </div>
                <div className="min-w-0">
                  <p className={cn('text-xs font-semibold truncate', isCurrent && 'text-primary')}>
                    {s.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate hidden sm:block">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Wizard Form Card (Left Column) */}
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {currentStep === 1 && 'Paso 1: Credenciales de Acceso & Políticas IAM'}
                    {currentStep === 2 && 'Paso 2: Información Corporativa & Facturación Fiscal'}
                    {currentStep === 3 && 'Paso 3: Selección de Plan & Asignación de Recursos'}
                    {currentStep === 4 && 'Paso 4: Revisión General & Aprovisionamiento Final'}
                  </CardTitle>
                  <CardDescription>
                    {currentStep === 1 && 'Configura los datos del administrador principal y las políticas de acceso con doble factor.'}
                    {currentStep === 2 && 'Registra la identidad legal de la organización para emisión de facturas y certificados.'}
                    {currentStep === 3 && 'Selecciona el nivel de servicio y ajusta los asientos concurrentes necesarios.'}
                    {currentStep === 4 && 'Verifica los parámetros antes de enviar la orden criptográfica al clúster de producción.'}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs shrink-0 hidden sm:inline-flex">
                  Paso {currentStep} de 4
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* STEP 1: Credenciales */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Correo Electrónico del Titular *</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          className="pl-9 font-mono text-xs"
                          value={wizardData.accountEmail}
                          onChange={(e) => setWizardData({ ...wizardData, accountEmail: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Nombre de Usuario (Login ID) *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9 font-mono text-xs"
                          value={wizardData.accountUsername}
                          onChange={(e) => setWizardData({ ...wizardData, accountUsername: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Contraseña Segura *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          className="pl-9 font-mono text-xs"
                          value={wizardData.password}
                          onChange={(e) => setWizardData({ ...wizardData, password: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Confirmar Contraseña *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          className="pl-9 font-mono text-xs"
                          value={wizardData.confirmPassword}
                          onChange={(e) => setWizardData({ ...wizardData, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between p-3.5 rounded-2xl bg-muted/30 border border-border/50">
                    <div>
                      <p className="text-xs font-semibold text-foreground">Activar Autenticación 2FA (Recomendado)</p>
                      <p className="text-[11px] text-muted-foreground">
                        Obliga al uso de llaves TOTP o biometría WebAuthn en cada inicio de sesión.
                      </p>
                    </div>
                    <Switch
                      checked={wizardData.twoFactorEnabled}
                      onCheckedChange={(checked) => {
                        play('toggle');
                        setWizardData({ ...wizardData, twoFactorEnabled: checked });
                      }}
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: Perfil Corporativo */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Razón Social *</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          value={wizardData.companyName}
                          onChange={(e) => setWizardData({ ...wizardData, companyName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Número de Registro Fiscal (Tax ID / RUC) *</label>
                      <Input
                        className="font-mono text-xs"
                        value={wizardData.taxId}
                        onChange={(e) => setWizardData({ ...wizardData, taxId: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Dirección de Sede Central</label>
                      <Input
                        value={wizardData.billingAddress}
                        onChange={(e) => setWizardData({ ...wizardData, billingAddress: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">País de Operación</label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <select
                          value={wizardData.country}
                          onChange={(e) => setWizardData({ ...wizardData, country: e.target.value })}
                          className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-background border border-input text-foreground focus:outline-hidden focus:ring-2 focus:ring-ring"
                        >
                          {countryOptions.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.name} ({c.dialCode})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Persona Responsable de Contacto</label>
                      <Input
                        value={wizardData.contactName}
                        onChange={(e) => setWizardData({ ...wizardData, contactName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Teléfono de Contacto</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-9 font-mono text-xs tabular-nums"
                          value={wizardData.contactPhone}
                          onChange={(e) => setWizardData({ ...wizardData, contactPhone: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Plan & Cuotas */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* Cycle Toggle */}
                  <div className="flex items-center justify-center gap-3">
                    <span
                      className={cn(
                        'text-xs font-medium cursor-pointer',
                        wizardData.billingCycle === 'monthly' ? 'text-foreground font-semibold' : 'text-muted-foreground'
                      )}
                      onClick={() => setWizardData({ ...wizardData, billingCycle: 'monthly' })}
                    >
                      Facturación Mensual
                    </span>
                    <Switch
                      checked={wizardData.billingCycle === 'annual'}
                      onCheckedChange={(checked) => {
                        play('toggle');
                        setWizardData({ ...wizardData, billingCycle: checked ? 'annual' : 'monthly' });
                      }}
                    />
                    <span
                      className={cn(
                        'text-xs font-medium cursor-pointer flex items-center gap-1.5',
                        wizardData.billingCycle === 'annual' ? 'text-primary font-bold' : 'text-muted-foreground'
                      )}
                      onClick={() => setWizardData({ ...wizardData, billingCycle: 'annual' })}
                    >
                      <span>Anual</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/30">
                        Ahorro 20%
                      </Badge>
                    </span>
                  </div>

                  {/* Plans Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {wizardPlans.map((plan) => {
                      const isSelected = wizardData.selectedPlan === plan.id;
                      const price =
                        wizardData.billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

                      return (
                        <div
                          key={plan.id}
                          onClick={() => {
                            play('click');
                            setWizardData({ ...wizardData, selectedPlan: plan.id as any });
                          }}
                          className={cn(
                            'p-5 rounded-3xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between',
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-md ring-1 ring-primary/30'
                              : 'border-border/60 bg-card hover:bg-muted/30'
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-bold text-foreground">{plan.name}</h4>
                              {'popular' in plan && plan.popular && (
                                <Badge variant="default" className="text-[10px]">
                                  Popular
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
                              {plan.description}
                            </p>

                            <div className="flex items-baseline gap-1 mb-4 font-mono">
                              <span className="text-2xl font-bold text-foreground">${price}</span>
                              <span className="text-xs text-muted-foreground">/ asiento / mes</span>
                            </div>

                            <ul className="space-y-2 text-xs text-muted-foreground mb-4">
                              {plan.features.map((feat, i) => (
                                <li key={i} className="flex items-center gap-2">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <Button
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            className="w-full text-xs rounded-xl"
                          >
                            {isSelected ? 'Plan Seleccionado' : 'Elegir Plan'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Seats Counter Slider & Dedicated IP */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-foreground">Asientos Concurrentes:</span>
                        <span className="font-mono font-bold text-primary text-sm tabular-nums">
                          {wizardData.seatsCount} asientos
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={wizardData.seatsCount}
                        onChange={(e) => {
                          play('click');
                          setWizardData({ ...wizardData, seatsCount: parseInt(e.target.value) });
                        }}
                        className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-foreground">IP Dedicada Saliente (/32)</p>
                        <p className="text-[11px] text-muted-foreground">
                          +$45 USD/mes para lista blanca de firewalls
                        </p>
                      </div>
                      <Switch
                        checked={wizardData.dedicatedIp}
                        onCheckedChange={(checked) => {
                          play('toggle');
                          setWizardData({ ...wizardData, dedicatedIp: checked });
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Revisión & Confirmación */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="p-5 rounded-3xl bg-muted/30 border border-border/60 space-y-4">
                    <h4 className="text-xs font-bold text-foreground tracking-wide uppercase font-mono">
                      Ficha de Resumen de Contratación
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Razón Social:</span>
                        <span className="font-semibold text-foreground">{wizardData.companyName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Identificador Fiscal:</span>
                        <span className="font-mono text-foreground">{wizardData.taxId}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Administrador Principal:</span>
                        <span className="font-semibold text-foreground">{wizardData.accountEmail}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Autenticación 2FA:</span>
                        <Badge variant={wizardData.twoFactorEnabled ? 'outline' : 'secondary'} className="text-[10px]">
                          {wizardData.twoFactorEnabled ? 'Habilitado (Activo)' : 'Desactivado'}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Plan Contratado:</span>
                        <span className="font-semibold text-primary">{selectedPlanDetails.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Capacidad:</span>
                        <span className="font-mono tabular-nums text-foreground">{wizardData.seatsCount} Asientos</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/40 flex justify-between items-center text-xs">
                      <span className="font-semibold text-foreground">Total Estimado ({wizardData.billingCycle}):</span>
                      <span className="text-xl font-bold font-mono text-primary tabular-nums">
                        ${totalCost.toLocaleString('en-US')}.00 USD
                      </span>
                    </div>
                  </div>

                  {/* Terms Acceptance */}
                  <label className="flex items-start gap-2.5 cursor-pointer p-3 rounded-2xl bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors">
                    <input
                      type="checkbox"
                      checked={wizardData.acceptedTerms}
                      onChange={(e) => {
                        play('click');
                        setWizardData({ ...wizardData, acceptedTerms: e.target.checked });
                      }}
                      className="mt-0.5 accent-primary h-4 w-4 rounded-md cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground leading-snug">
                      Acepto los términos del Acuerdo de Nivel de Servicio (SLA 99.9%), las directivas de seguridad criptográfica y autorizo el aprovisionamiento de nodos.
                    </span>
                  </label>

                  {isCompleted && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      <div>
                        <p className="font-bold">¡Aprovisionamiento Exitoso!</p>
                        <p className="text-[11px] mt-0.5">
                          Licencia generada. Clave criptográfica enviada al correo {wizardData.accountEmail}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stepper Navigation Buttons */}
              <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentStep === 1 || isCompleted}
                  onClick={handleBack}
                  className="gap-1.5 text-xs"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Anterior</span>
                </Button>

                {currentStep < 4 ? (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleNext}
                    className="gap-1.5 text-xs px-5"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    disabled={isCompleted}
                    onClick={handleFinish}
                    className="gap-1.5 text-xs px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Confirmar & Activar</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Onboarding Summary Sidebar (Right Column) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Real-time Order & Cluster Summary Card */}
          <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Resumen de Aprovisionamiento
                </CardTitle>
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                  En Proceso
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Parámetros y recursos calculados en tiempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Plan Box */}
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    Plan {selectedPlanDetails.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {wizardData.billingCycle === 'annual' ? 'Facturación Anual' : 'Mensual'}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1 font-mono">
                  <span className="text-xl font-bold text-foreground">
                    ${monthlyCost}
                  </span>
                  <span className="text-[11px] text-muted-foreground">/ asiento / mes</span>
                </div>
              </div>

              {/* Resource Breakdown List */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Asientos Asignados:</span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">
                    {wizardData.seatsCount} usuarios
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/30">
                  <span className="text-muted-foreground">IP Dedicada (/32):</span>
                  <span className="font-semibold text-foreground">
                    {wizardData.dedicatedIp ? 'Habilitada ($45/m)' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Autenticación 2FA:</span>
                  <span className={cn('font-semibold', wizardData.twoFactorEnabled ? 'text-emerald-500' : 'text-amber-500')}>
                    {wizardData.twoFactorEnabled ? 'Requerida (MFA)' : 'Básica'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Organización:</span>
                  <span className="font-semibold text-foreground truncate max-w-[150px]">
                    {wizardData.companyName || 'Pendiente'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 font-mono">
                  <span className="text-xs font-bold text-foreground">Costo Estimado:</span>
                  <span className="text-base font-bold text-primary tabular-nums">
                    ${totalCost.toLocaleString('en-US')}.00 USD
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contextual Step Telemetry Card */}
          <Card className="rounded-2xl border-border/50 bg-card/70 backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-primary" />
                <span>Seguridad & Telemetría Cloud</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs leading-relaxed text-muted-foreground">
              {currentStep === 1 && (
                <p>
                  Las credenciales maestras tendrán privilegios globales <code className="text-foreground font-mono text-[11px] bg-muted px-1 py-0.5 rounded">iam:root</code>. La autenticación 2FA protegerá la emisión de tokens JWT de sesión.
                </p>
              )}
              {currentStep === 2 && (
                <p>
                  La información fiscal se valida contra las directivas de facturación electrónica. Asegúrate de que el Tax ID coincida con la razón social registrada.
                </p>
              )}
              {currentStep === 3 && (
                <p>
                  Los recursos seleccionados se despliegan automáticamente en nodos multi-región con redundancia en caliente y réplicas de base de datos distribuidas.
                </p>
              )}
              {currentStep === 4 && (
                <p>
                  Al confirmar, se generará una firma criptográfica inmutable en los registros de auditoría y se activarán las credenciales de producción.
                </p>
              )}

              <div className="pt-2 border-t border-border/30 flex items-center gap-2 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>SLA 99.9% de Disponibilidad Garantizada</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
