# Emisor · La Luz del Tiempo

Aplicación nativa (Windows y macOS) para transmitir la salida de la consola a la radio. Hecha con
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
- Si se corta la red o se reinicia el servidor, **reintenta solo** (2 s … 15 s) y lo muestra como *Reconectando*.
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
- La contraseña va al **llavero del sistema** (Credential Manager en Windows, Keychain en macOS).

## Datos que necesitas (te los da el administrador de la radio)

| Campo | Ejemplo |
|---|---|
| Servidor | `192.168.1.11` (la IP de la PC que corre la radio) |
| Puerto de locutores | `8005` |
| Puerto de oyentes | `8000` |
| Mount | `/principal` |
| Contraseña del locutor | (la genera el panel en Configuración → Radio) |

## Compilar en Windows

1. Instala **Visual Studio Build Tools** con la carga de trabajo *Desarrollo de escritorio con C++*.
2. Instala **Rust**: descarga `rustup-init.exe` de https://rustup.rs y ejecútalo con la opción por defecto.
3. Instala **Node.js 22** y **pnpm** (`npm i -g pnpm`).
4. En esta carpeta:
   ```powershell
   pnpm install
   pnpm tauri build
   ```
5. El instalador queda en `src-tauri\target\release\bundle\msi\` (y `nsis\`). Instálalo con doble clic.

Para probar sin instalar: `pnpm tauri dev`.

## Compilar en macOS

```bash
pnpm install
pnpm tauri build      # genera .app y .dmg en src-tauri/target/release/bundle/
```

## Antes de salir al aire (Windows)

- **Permiso del micrófono:** Configuración → Privacidad y seguridad → Micrófono → activa
  *Permitir que las aplicaciones de escritorio accedan al micrófono*.
- **Red:** la PC de la radio y esta PC deben estar en la misma red, y el puerto 8005 debe estar
  abierto en la PC de la radio.
- Pulsa **Probar conexión** en Configuración: debe responder "Servidor en línea".

## Desarrollo

- `pnpm dev` abre la interfaz en el navegador con un **simulador del núcleo** (`src/dev/simulador.ts`).
  En la consola del navegador: `simular.silencio()`, `simular.saturar()`, `simular.redLenta()`, `simular.corte()`.
  El simulador solo se carga fuera de Tauri y nunca entra en el instalador.
- `src/App.tsx` (ventana principal), `src/mini.tsx` (ventana mini), `src/comun.tsx` (estado y medidores compartidos).
- `src-tauri/src/ventanas.rs`: ventana mini, bandeja del sistema, minimizar y cerrar.
- `src-tauri/src/historial.rs`: historial de sucesos (JSON por línea, con rotación).

- `src-tauri/src/audio.rs`: dispositivos, captura (entradas y loopback), canales, remuestreo, medición L/R y limitador (con pruebas).
- `src-tauri/examples/prueba_partes.rs`: diagnóstico sin ventana:
  `cargo run --example prueba_partes -- dispositivos` y
  `cargo run --example prueba_partes -- captura "salida:Altavoces (...)" 48000`
- `src-tauri/src/emision.rs`: motor (captura, codificación, grabación, conexión, reintentos, medidores, aire muerto).
- `src-tauri/src/transmision.rs`: envío al harbor de Liquidsoap (PUT de audio crudo sobre TCP).
- `src-tauri/src/icecast.rs`: oyentes y estado del mount.
- `src-tauri/examples/prueba_emision.rs`: prueba del motor sin ventana:
  `cargo run --example prueba_emision -- <servidor> <puerto> <mount> <clave> <segundos>`
