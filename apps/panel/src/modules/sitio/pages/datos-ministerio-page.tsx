import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { datosMinisterioSchema, soloDigitos, validarTelefono, PAIS_PREDETERMINADO } from '@luz/shared';
import type { DatosMinisterioInput } from '@luz/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../shared/components/ui/card';
import { Button } from '../../../shared/components/ui/button';
import { Input } from '../../../shared/components/ui/input';
import { luzApi } from '../../../shared/api/luz-api';
import { pillToast } from '../../../shared/components/ui/pill-toast';
import { EtiquetaCampo, ErrorCampo } from '../../contenido/components/dialogo-contenido';
import { TelefonoInput } from '../../usuarios/components/telefono-input';

const VACIO: DatosMinisterioInput = {
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  redes: { youtube: '', tiktok: '', facebook: '', appAndroid: '' },
};

// Datos generales del ministerio: contacto, redes y app. La web los muestra en el pie y en contacto.
export const DatosMinisterioPage: React.FC = () => {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['gestion', 'sitio'], queryFn: () => luzApi.getSitio() });
  const [form, setForm] = useState<DatosMinisterioInput>(VACIO);
  const [waCodigo, setWaCodigo] = useState(PAIS_PREDETERMINADO);
  const [waNumero, setWaNumero] = useState('');
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm(data.datos);
    // "+591 70000000" -> código y número por separado
    const guardado = data.datos.whatsapp.trim();
    const m = guardado.match(/^(\+\d{1,4})\s*(.*)$/);
    setWaCodigo(m ? m[1] : PAIS_PREDETERMINADO);
    setWaNumero(m ? soloDigitos(m[2]) : soloDigitos(guardado));
  }, [data]);

  const campo = (ruta: 'whatsapp' | 'email' | 'address' | 'city', valor: string) => setForm((f) => ({ ...f, [ruta]: valor }));
  const red = (clave: keyof DatosMinisterioInput['redes'], valor: string) => setForm((f) => ({ ...f, redes: { ...f.redes, [clave]: valor } }));

  const guardar = async () => {
    const errorWa = waNumero ? validarTelefono(waCodigo, waNumero) : null;
    if (errorWa) {
      setErrorForm(errorWa);
      return;
    }
    const parsed = datosMinisterioSchema.safeParse({ ...form, whatsapp: waNumero ? `${waCodigo} ${waNumero}` : '' });
    if (!parsed.success) {
      setErrorForm(parsed.error.issues[0]?.message ?? 'Revisa los datos.');
      return;
    }
    setErrorForm(null);
    setEnviando(true);
    try {
      await luzApi.setSitio(parsed.data);
      await qc.invalidateQueries({ queryKey: ['gestion', 'sitio'] });
      pillToast.success('Datos guardados', 'La web ya muestra los datos nuevos.');
    } catch (err) {
      pillToast.error('No se pudieron guardar', err instanceof Error ? err.message : 'Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <p className="text-xs text-muted-foreground font-mono mb-1.5">Sitio web / Datos del ministerio</p>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight">Datos del ministerio</h1>
        <p className="text-sm text-muted-foreground mt-1">Contacto, redes y app. Lo que dejes vacío no se muestra en la web.</p>
      </div>

      {error ? (
        <p className="text-xs text-red-400">No se pudieron cargar los datos.</p>
      ) : isLoading ? (
        <p className="text-xs text-muted-foreground">Cargando…</p>
      ) : (
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Contacto</CardTitle>
              <CardDescription className="text-xs">Elige el país y escribe el número. En Bolivia son 8 dígitos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <EtiquetaCampo htmlFor="sitio-whatsapp">WhatsApp</EtiquetaCampo>
                <TelefonoInput id="sitio-whatsapp" codigo={waCodigo} numero={waNumero} onChange={(c, n) => { setWaCodigo(c); setWaNumero(soloDigitos(n)); }} />
              </div>
              <div>
                <EtiquetaCampo htmlFor="sitio-email">Correo</EtiquetaCampo>
                <Input id="sitio-email" value={form.email} onChange={(e) => campo('email', e.target.value)} placeholder="contacto@…" className="text-xs" />
              </div>
              <div>
                <EtiquetaCampo htmlFor="sitio-direccion">Dirección</EtiquetaCampo>
                <Input id="sitio-direccion" value={form.address} onChange={(e) => campo('address', e.target.value)} className="text-xs" />
              </div>
              <div>
                <EtiquetaCampo htmlFor="sitio-ciudad">Ciudad</EtiquetaCampo>
                <Input id="sitio-ciudad" value={form.city} onChange={(e) => campo('city', e.target.value)} className="text-xs" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Redes y app</CardTitle>
              <CardDescription className="text-xs">Enlaces completos (https://…).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <EtiquetaCampo htmlFor="red-youtube">YouTube</EtiquetaCampo>
                <Input id="red-youtube" value={form.redes.youtube} onChange={(e) => red('youtube', e.target.value)} placeholder="https://www.youtube.com/@…" className="text-xs font-mono" />
              </div>
              <div>
                <EtiquetaCampo htmlFor="red-tiktok">TikTok</EtiquetaCampo>
                <Input id="red-tiktok" value={form.redes.tiktok} onChange={(e) => red('tiktok', e.target.value)} placeholder="https://www.tiktok.com/@…" className="text-xs font-mono" />
              </div>
              <div>
                <EtiquetaCampo htmlFor="red-facebook">Facebook</EtiquetaCampo>
                <Input id="red-facebook" value={form.redes.facebook} onChange={(e) => red('facebook', e.target.value)} placeholder="https://www.facebook.com/…" className="text-xs font-mono" />
              </div>
              <div>
                <EtiquetaCampo htmlFor="red-app">App Android (Google Play)</EtiquetaCampo>
                <Input id="red-app" value={form.redes.appAndroid} onChange={(e) => red('appAndroid', e.target.value)} placeholder="https://play.google.com/store/apps/details?id=…" className="text-xs font-mono" />
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-3">
            <ErrorCampo texto={errorForm} />
            <div className="flex justify-end">
              <Button type="button" size="sm" className="text-xs" disabled={enviando} onClick={guardar}>
                {enviando ? 'Guardando…' : 'Guardar datos'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
