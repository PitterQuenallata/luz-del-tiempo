# Emisor · La Luz del Tiempo

Aplicación nativa (Windows y macOS) para transmitir el micrófono a la radio. Hecha con
**Tauri 2**: el motor de audio, la codificación MP3 (LAME) y el envío al servidor están en
**Rust**; la ventana es una interfaz pequeña.

## Qué hace

- Captura el micrófono elegido y lo convierte a MP3 estéreo de 44.1 kHz (calidad 64–192 kbps).
- Lo envía al punto de transmisión (mount) de la radio. Liquidsoap le da prioridad sobre la música automática.
- Si se corta la red o se reinicia el servidor, **reintenta solo** con espera creciente (2 s … 15 s).
- Si la contraseña es incorrecta, lo dice y **no** reintenta.
- Guarda la contraseña en el **llavero del sistema** (Credential Manager en Windows, Keychain en macOS).
- Muestra nivel del micrófono, tiempo al aire y oyentes conectados.

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

- `src-tauri/src/audio.rs`: captura, conversión a estéreo y remuestreo a 44.1 kHz (con pruebas).
- `src-tauri/src/emision.rs`: motor (captura, codificación, conexión, reintentos, medidores).
- `src-tauri/src/transmision.rs`: envío al harbor de Liquidsoap (PUT de audio crudo sobre TCP).
- `src-tauri/src/icecast.rs`: oyentes y estado del mount.
- `src-tauri/examples/prueba_emision.rs`: prueba del motor sin ventana:
  `cargo run --example prueba_emision -- <servidor> <puerto> <mount> <clave> <segundos>`
