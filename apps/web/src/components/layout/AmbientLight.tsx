/**
 * Fondo vivo: una sola capa fija detrás de toda la página con dos luces muy
 * suaves (azul y dorada) que se mueven lento, en ciclos de 70 y 90 segundos.
 * Hace que bajar por la página se sienta como recorrer un mismo lugar.
 * Solo CSS (transform), sin JavaScript; se queda quieta con "reducir movimiento".
 */
export function AmbientLight() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="ambient-a absolute -top-1/4 -left-1/4 h-[80vmax] w-[80vmax] rounded-full bg-[radial-gradient(circle,rgba(34,55,106,0.55)_0%,transparent_60%)]" />
      <div className="ambient-b absolute -right-1/4 -bottom-1/3 h-[70vmax] w-[70vmax] rounded-full bg-[radial-gradient(circle,rgba(226,169,39,0.07)_0%,transparent_60%)]" />
    </div>
  );
}
