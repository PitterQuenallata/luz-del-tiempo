import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { datosPersonalesSchema, cambioContrasenaSchema, normalizarNombre } from '@luz/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Badge } from '../../../shared/components/ui/badge';
import { luzApi } from '../../../shared/api/luz-api';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { iniciales } from '../../../shared/lib/utils';
import { mensajeCampo } from '../../../shared/lib/form';
import { useSession, SESSION_QUERY_KEY } from '../../auth/hooks/use-session';
import { FotoPerfil } from '../../usuarios/components/foto-perfil';
import { TelefonoInput } from '../../usuarios/components/telefono-input';
import { formatoUltimoAcceso } from '../../usuarios/lib/usuario';

// Ajustes de mi perfil: foto, datos personales, teléfono y contraseña (TanStack Form + @luz/shared).
export const PerfilPage: React.FC = () => {
  const { data: yo } = useSession();
  const qc = useQueryClient();
  const { data: paisesData } = useQuery({ queryKey: ['paises'], queryFn: () => luzApi.listPaises(), staleTime: Infinity });

  const datos = useForm({
    defaultValues: { firstName: '', lastName: '', phoneCode: '+591', phone: '' },
    validators: { onChange: datosPersonalesSchema, onSubmit: datosPersonalesSchema },
    onSubmit: async ({ value }) => {
      const d = datosPersonalesSchema.parse(value);
      try {
        await luzApi.updateMe({ firstName: d.firstName, lastName: d.lastName, phoneCode: d.phoneCode, phone: d.phone || null });
        await qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
        pillToast.success('Perfil guardado');
      } catch (err) {
        pillToast.error('No se pudo guardar', err instanceof Error ? err.message : 'Inténtalo de nuevo.');
      }
    },
  });

  const clave = useForm({
    defaultValues: { actual: '', nueva: '', repetir: '' },
    validators: { onChange: cambioContrasenaSchema, onSubmit: cambioContrasenaSchema },
    onSubmit: async ({ value }) => {
      try {
        await luzApi.changePassword(value.actual, value.nueva);
        clave.reset();
        await qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
        pillToast.success('Contraseña actualizada');
      } catch (err) {
        pillToast.error('No se pudo cambiar la contraseña', err instanceof Error ? err.message : 'Revisa tu contraseña actual.');
      }
    },
  });

  // Carga los datos del usuario al abrir la página
  useEffect(() => {
    if (!yo) return;
    datos.setFieldValue('firstName', yo.firstName ?? '');
    datos.setFieldValue('lastName', yo.lastName ?? '');
    datos.setFieldValue('phoneCode', yo.phoneCode ?? paisesData?.predeterminado ?? '+591');
    datos.setFieldValue('phone', yo.phone ?? '');
  }, [yo, paisesData]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!yo) return <p className="text-xs text-muted-foreground">Cargando perfil…</p>;

  return (
    <div className="space-y-6 pb-16 max-w-3xl">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Cuenta / Mi perfil</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Ajustes de mi perfil</h1>
      </div>

      <Card className="border-border">
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <FotoPerfil id={yo.id} fotoUrl={yo.fotoUrl} iniciales={iniciales(yo.name)} tamano="h-16 w-16" editable />
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold truncate">{yo.name}</CardTitle>
            <CardDescription className="text-xs font-mono truncate">{yo.email}</CardDescription>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary" className="text-[10px]">{yo.roleName ?? 'Sin rol'}</Badge>
              <span className="text-[11px] text-muted-foreground">Último acceso: {formatoUltimoAcceso(yo.lastLoginAt)}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Datos personales</CardTitle>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); datos.handleSubmit(); }} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <datos.Field name="firstName">
                {(f) => (
                  <div className="space-y-1.5">
                    <label htmlFor="perfil-nombres" className="font-medium block">Nombres *</label>
                    <Input id="perfil-nombres" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={() => { f.handleChange(normalizarNombre(f.state.value)); f.handleBlur(); }} className="text-xs" />
                    {f.state.meta.isTouched && <p className="text-[11px] text-red-400">{mensajeCampo(f.state.meta.errors)}</p>}
                  </div>
                )}
              </datos.Field>
              <datos.Field name="lastName">
                {(f) => (
                  <div className="space-y-1.5">
                    <label htmlFor="perfil-apellidos" className="font-medium block">Apellidos *</label>
                    <Input id="perfil-apellidos" value={f.state.value} onChange={(e) => f.handleChange(e.target.value)} onBlur={() => { f.handleChange(normalizarNombre(f.state.value)); f.handleBlur(); }} className="text-xs" />
                    {f.state.meta.isTouched && <p className="text-[11px] text-red-400">{mensajeCampo(f.state.meta.errors)}</p>}
                  </div>
                )}
              </datos.Field>
            </div>
            <div className="space-y-1.5">
              <p className="font-medium">Teléfono</p>
              <datos.Field name="phoneCode">
                {(codigo) => (
                  <datos.Field name="phone">
                    {(numero) => (
                      <>
                        <TelefonoInput id="perfil-tel" codigo={codigo.state.value} numero={numero.state.value} onChange={(c, n) => { codigo.handleChange(c); numero.handleChange(n); }} />
                        {numero.state.meta.isTouched && <p className="text-[11px] text-red-400">{mensajeCampo(numero.state.meta.errors)}</p>}
                      </>
                    )}
                  </datos.Field>
                )}
              </datos.Field>
            </div>
            <div className="flex justify-end">
              <datos.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting, s.isDirty]}>
                {([puedeEnviar, enviando, cambio]) => (
                  <Button type="submit" variant="default" size="sm" disabled={!cambio || !puedeEnviar || enviando} className="text-xs">
                    {enviando ? 'Guardando…' : 'Guardar datos'}
                  </Button>
                )}
              </datos.Subscribe>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Cambiar contraseña</CardTitle>
          <CardDescription className="text-xs">Mínimo 8 caracteres y distinta de la actual.</CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); clave.handleSubmit(); }} className="space-y-3 text-xs">
            {(['actual', 'nueva', 'repetir'] as const).map((campo) => (
              <clave.Field key={campo} name={campo}>
                {(f) => (
                  <div className="space-y-1.5">
                    <Input
                      type="password"
                      placeholder={campo === 'actual' ? 'Contraseña actual' : campo === 'nueva' ? 'Nueva contraseña' : 'Repetir nueva contraseña'}
                      aria-label={campo === 'actual' ? 'Contraseña actual' : campo === 'nueva' ? 'Nueva contraseña' : 'Repetir nueva contraseña'}
                      value={f.state.value}
                      onChange={(e) => f.handleChange(e.target.value)}
                      onBlur={f.handleBlur}
                      className="text-xs"
                    />
                    {f.state.meta.isTouched && <p className="text-[11px] text-red-400">{mensajeCampo(f.state.meta.errors)}</p>}
                  </div>
                )}
              </clave.Field>
            ))}
            <div className="flex justify-end">
              <clave.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
                {([puedeEnviar, enviando]) => (
                  <Button type="submit" variant="default" size="sm" disabled={!puedeEnviar || enviando} className="text-xs">
                    {enviando ? 'Cambiando…' : 'Cambiar contraseña'}
                  </Button>
                )}
              </clave.Subscribe>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerfilPage;
