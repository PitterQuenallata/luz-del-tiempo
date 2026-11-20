import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { Badge } from '../../../shared/components/ui/badge';
import { luzApi } from '../../../shared/api/luz-api';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { iniciales } from '../../../shared/lib/utils';
import { useSession, SESSION_QUERY_KEY } from '../../auth/hooks/use-session';
import { FotoPerfil } from '../../usuarios/components/foto-perfil';
import { TelefonoInput, telefonoValido } from '../../usuarios/components/telefono-input';
import { formatoUltimoAcceso } from '../../usuarios/lib/usuario';
import { errorNombre, normalizarNombre } from '../../../shared/lib/validaciones';
import { useQuery } from '@tanstack/react-query';

// Ajustes de mi perfil: foto, datos personales, teléfono y contraseña.
export const PerfilPage: React.FC = () => {
  const { data: yo } = useSession();
  const qc = useQueryClient();
  const { data: paisesData } = useQuery({ queryKey: ['paises'], queryFn: () => luzApi.listPaises(), staleTime: Infinity });
  const paises = paisesData?.paises ?? [];

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneCode, setPhoneCode] = useState('+591');
  const [phone, setPhone] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetir, setRepetir] = useState('');
  const [cambiando, setCambiando] = useState(false);

  useEffect(() => {
    if (!yo) return;
    setFirstName(yo.firstName ?? '');
    setLastName(yo.lastName ?? '');
    setPhoneCode(yo.phoneCode ?? paisesData?.predeterminado ?? '+591');
    setPhone(yo.phone ?? '');
  }, [yo, paisesData]);

  if (!yo) return <p className="text-xs text-muted-foreground">Cargando perfil…</p>;

  const telValido = telefonoValido(phoneCode, phone, paises);
  const errNombres = errorNombre(firstName, 'Nombres');
  const errApellidos = errorNombre(lastName, 'Apellidos');
  const datosValidos = !errNombres && !errApellidos && telValido;

  const guardarDatos = async () => {
    setGuardando(true);
    try {
      await luzApi.updateMe({ firstName: normalizarNombre(firstName), lastName: normalizarNombre(lastName), phoneCode, phone: phone || null });
      await qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      pillToast.success('Perfil guardado');
    } catch (err) {
      pillToast.error('No se pudo guardar', err instanceof Error ? err.message : 'Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarContrasena = async () => {
    if (nueva !== repetir) return pillToast.error('Las contraseñas no coinciden');
    setCambiando(true);
    try {
      await luzApi.changePassword(actual, nueva);
      setActual(''); setNueva(''); setRepetir('');
      await qc.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      pillToast.success('Contraseña actualizada');
    } catch (err) {
      pillToast.error('No se pudo cambiar la contraseña', err instanceof Error ? err.message : 'Revisa tu contraseña actual.');
    } finally {
      setCambiando(false);
    }
  };

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
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="perfil-nombres" className="font-medium block">Nombres *</label>
              <Input id="perfil-nombres" value={firstName} onChange={(e) => setFirstName(e.target.value)} onBlur={() => setFirstName(normalizarNombre(firstName))} className="text-xs" />
              {errNombres && <p className="text-[11px] text-red-400">{errNombres}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="perfil-apellidos" className="font-medium block">Apellidos *</label>
              <Input id="perfil-apellidos" value={lastName} onChange={(e) => setLastName(e.target.value)} onBlur={() => setLastName(normalizarNombre(lastName))} className="text-xs" />
              {errApellidos && <p className="text-[11px] text-red-400">{errApellidos}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="font-medium">Teléfono</p>
            <TelefonoInput id="perfil-tel" codigo={phoneCode} numero={phone} onChange={(c, n) => { setPhoneCode(c); setPhone(n); }} />
          </div>
          <div className="flex justify-end">
            <Button variant="default" size="sm" disabled={!datosValidos || guardando} onClick={guardarDatos} className="text-xs">
              {guardando ? 'Guardando…' : 'Guardar datos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Cambiar contraseña</CardTitle>
          <CardDescription className="text-xs">Mínimo 4 caracteres.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <Input type="password" placeholder="Contraseña actual" value={actual} onChange={(e) => setActual(e.target.value)} className="text-xs" aria-label="Contraseña actual" />
          <Input type="password" placeholder="Nueva contraseña" value={nueva} onChange={(e) => setNueva(e.target.value)} className="text-xs" aria-label="Nueva contraseña" />
          {nueva && nueva.length < 4 && <p className="text-[11px] text-red-400">La contraseña debe tener al menos 4 caracteres.</p>}
          {repetir && nueva !== repetir && <p className="text-[11px] text-red-400">Las contraseñas no coinciden.</p>}
          <Input type="password" placeholder="Repetir nueva contraseña" value={repetir} onChange={(e) => setRepetir(e.target.value)} className="text-xs" aria-label="Repetir nueva contraseña" />
          <div className="flex justify-end">
            <Button
              variant="default"
              size="sm"
              disabled={!actual || nueva.length < 4 || !repetir || cambiando}
              onClick={cambiarContrasena}
              className="text-xs"
            >
              {cambiando ? 'Cambiando…' : 'Cambiar contraseña'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerfilPage;
