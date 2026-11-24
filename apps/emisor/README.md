# Emisor · La Luz del Tiempo

Aplicación de Windows para transmitir la salida de la consola a la radio. Hecha con
**Tauri 2**: el motor de audio, la codificación MP3 (LAME) y el envío al servidor están en
**Rust**; la ventana es una interfaz pequeña.

## Qué hace

La consola de la radio hace la mezcla; el emisor es el último eslabón: toma su salida y la manda a internet,
y se asegura de que llegue siempre, llegue bien y, si algo falla, que el operador se entere.

**Fuente**
- **Entradas**: consola, interfaz de audio o micrófono. Se elige qué canales usar
  (1 y 2 en estéreo, 3 y 4, o un solo canal).
- **Sonido de la PC** (solo Windows): lo que suena en una salida (loopback de WASAPI).
  Si no suena nada, envía silencio para no cortar la transmisión.
- **Probar nivel** en Configuración antes de salir al aire.

**Calidad**: MP3 de 64 a 320 kbps, 44.1 o 48 kHz, estéreo o mono, tres niveles de esfuerzo del codificador.

**Que no se caiga**
- Si se corta la red o la radio no responde, **reintenta 3 veces (unos 15 s)** y se detiene: el servidor pone al
  AutoDJ solo. El operador vuelve con **Reintentar conexión**. Lo mismo si se desconecta la fuente de audio.
- Envío real en kbps y aviso si la conexión no alcanza para el bitrate (se está perdiendo audio).
- Si la contraseña es incorrecta, lo dice y **no** reintenta.

**Aire muerto**
- A los 10 s sin sonido avisa en pantalla, en la ventana mini y con parpadeo en la barra de tareas.
- Opcional (casilla en Configuración): si el silencio dura N minutos, **suelta el aire** para que entre el AutoDJ.

**Señal**
- Medidor estéreo L/R en dB con retención de pico, como el de una consola.
- Aviso y contador de **saturaciones** (la entrada llegó a 0 dB).
- **Limitador de seguridad** sin perillas: nada sale por encima de -1 dBFS. Con niveles normales no actúa.

**Respaldo**
- **Grabación** opcional de cada emisión en MP3 (Documentos\Emisor La Luz del Tiempo\Grabaciones).
  Sigue grabando aunque se corte internet.
- **Historial**: salidas al aire, cortes, reconexiones, silencios, saturaciones y duración de cada emisión.

**Comodidad**
- **Ventana mini** siempre encima con estado, tiempo, nivel y oyentes. Aparece al minimizar mientras se transmite.
- Icono en la **bandeja del sistema**. Cerrar la ventana no corta la transmisión: solo *Salir* desde la bandeja.
- Inicio con Windows y retomar la transmisión tras un apagón o reinicio (desactivables).

**Cuenta del panel**
- El locutor inicia sesión con su usuario del panel (correo y contraseña). La dirección del panel viene de fábrica.
- Recibe solo las emisoras en las que está autorizado (panel: Configuración de radio, Locutores) y cambia
  de emisora con un selector. Servidor, puertos y contraseñas no se escriben ni se ven.
- Token de sesión y contraseñas de las emisoras en el **llavero de Windows** (Credential Manager).
- Sin conexión con el panel usa la última lista guardada: la API nunca impide salir al aire.
- Avisa al panel al empezar, cada 60 s y al terminar: el panel muestra *En vivo ahora* (locutor, emisora,
  PC, IP, envío, incidencias) y los reportes mensuales de horas al aire.
- Sin cuenta se puede usar la **conexión manual** (servidor, puertos, mount y contraseña), como antes.

**Lo que se ve al aire**
- *Al aire se muestra*: programa y conductor que ven los oyentes en la web, la app y los reproductores.
  Por defecto salen de la programación del panel; el locutor puede escribir otros antes o durante el programa.

**Actualizaciones**
- Al abrir, el emisor revisa si hay una versión nueva publicada en el panel y la instala con un clic
  (descarga verificada con la firma de actualizaciones; no se actualiza mientras transmite).

## Conexión manual (sin cuenta del panel)

| Campo | Ejemplo |
|---|---|
| Servidor | `192.168.1.11` (la IP de la PC que corre la radio) |
| Puerto de locutores | `8005` |
| Puerto de oyentes | `8000` |
| Mount | `/principal` |
| Contraseña del locutor | (la genera el panel en Configuración de radio, Transmisión) |

## Compilar

Requisitos (una vez): **Visual Studio Build Tools** con *Desarrollo de escritorio con C++*, **Rust**
(https://rustup.rs) y **Node.js 22**.

```powershell
pnpm install
.\compilar.ps1                                   # panel de producción
.\compilar.ps1 -Panel http://192.168.1.11:4000   # pruebas contra el panel de la red local
```

Deja en `src-tauri\target\release\bundle\` el instalador NSIS (`nsis\…-setup.exe`, el que se reparte),
su firma de actualización (`…-setup.exe.sig`) y el MSI. Para probar sin instalar: `pnpm tauri dev`.

### Clave de actualizaciones

Las actualizaciones van firmadas con la clave `%USERPROFILE%\.tauri\emisor-actualizaciones.key` (la pública
está en `tauri.conf.json`). **Guárdala en un lugar seguro**: sin ella no se pueden publicar versiones para los
emisores ya instalados. Nunca va al repositorio.

### Publicar una versión

1. Sube la versión en `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` y `package.json` (p. ej. 0.2.0 → 0.2.1).
2. `.\compilar.ps1`
3. En el panel, Configuración de radio, *Emisor de Windows* (superadmin): sube el `…-setup.exe` y su `.sig`.
   Los emisores la ofrecen al abrirse. Desde ahí también se descarga el instalador para una PC nueva.

### Firma de código (quitar el aviso «editor desconocido» de Windows)

Hace falta un certificado de firma de código a nombre del ministerio, emitido por una autoridad reconocida
(OV; por ejemplo Certum *Code Signing in the Cloud*, Sectigo o DigiCert). Con el certificado instalado en
Windows, antes de compilar:

```powershell
$env:EMISOR_FIRMA_HUELLA = "<huella SHA1 del certificado>"
.\compilar.ps1
```

`src-tauri\firmar.ps1` firma el programa y los instaladores con `signtool` (SDK de Windows) y sello de tiempo.
Sin certificado, compila igual y solo avisa que quedan sin firmar. También acepta un `.pfx`
(`EMISOR_FIRMA_PFX` y `EMISOR_FIRMA_PFX_CLAVE`).

## Antes de salir al aire (Windows)

- **Permiso del micrófono:** Configuración → Privacidad y seguridad → Micrófono → activa
  *Permitir que las aplicaciones de escritorio accedan al micrófono*.
- **Red:** la PC de la radio y esta PC deben estar en la misma red, y el puerto 8005 debe estar
  abierto en la PC de la radio.
- Al pulsar **Salir al aire**, el emisor comprueba la radio, la emisora y el sonido antes de la cuenta regresiva.

## Desarrollo

- `pnpm dev` abre la interfaz en el navegador con un **simulador del núcleo** (`src/dev/simulador.ts`).
  En la consola del navegador: `simular.silencio()`, `simular.saturar()`, `simular.redLenta()`, `simular.corte()`.
  El simulador solo se carga fuera de Tauri y nunca entra en el instalador.
- `src/App.tsx` (ventana principal), `src/mini.tsx` (ventana mini), `src/comun.tsx` (estado y medidores compartidos).
- `src-tauri/src/ventanas.rs`: ventana mini, bandeja del sistema, minimizar y cerrar.
- `src-tauri/src/historial.rs`: historial de sucesos (JSON por línea, con rotación).
- `src-tauri/src/cuenta.rs`: sesión del panel, emisoras del locutor, avisos de transmisión y título al aire.
- API: `apps/api/src/modules/emisor/` (sesión, emisoras, transmisiones, versiones) y
  `apps/api/src/modules/radio/radio-emisor.routes.ts` / `radio-reportes.routes.ts` (panel).

- `src-tauri/src/audio.rs`: dispositivos, captura (entradas y loopback), canales, remuestreo, medición L/R y limitador (con pruebas).
- `src-tauri/examples/prueba_partes.rs`: diagnóstico sin ventana:
  `cargo run --example prueba_partes -- dispositivos` y
  `cargo run --example prueba_partes -- captura "salida:Altavoces (...)" 48000`
- `src-tauri/src/emision.rs`: motor (captura, codificación, grabación, conexión, reintentos, medidores, aire muerto).
- `src-tauri/src/transmision.rs`: envío al harbor de Liquidsoap (PUT de audio crudo sobre TCP).
- `src-tauri/src/icecast.rs`: oyentes y estado del mount.
- `src-tauri/examples/prueba_emision.rs`: prueba del motor sin ventana:
  `cargo run --example prueba_emision -- <servidor> <puerto> <mount> <clave> <segundos>`
