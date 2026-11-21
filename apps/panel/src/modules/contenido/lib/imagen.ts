// Convierte el resultado del editor (data URL) en archivo. El recorte y la compresión los hace el servidor.
export async function ajustarDataUrlAArchivo(dataUrl: string, nombre: string): Promise<File> {
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], `${nombre}.jpg`, { type: blob.type || 'image/jpeg' });
}
