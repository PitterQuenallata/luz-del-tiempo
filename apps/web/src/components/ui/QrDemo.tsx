import { LogoMark } from "../layout/Logo";

/**
 * QR de muestra para la demo: patrón fijo que parece un QR real (con sus tres
 * esquinas de posición) y el logo al centro. NO se puede escanear; se reemplaza
 * por la imagen del QR del banco cuando el ministerio la entregue.
 */
export function QrDemo({ size = "h-40 w-40" }: { size?: string }) {
  const n = 25;
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  const cells: [number, number][] = [];
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (finder(x, y)) continue;
      if (x >= 9 && x <= 15 && y >= 9 && y <= 15) continue; // hueco del logo
      if ((x * 7 + y * 13 + x * y) % 5 < 2) cells.push([x, y]);
    }
  const eye = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="#0b1324" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#0b1324" />
    </g>
  );
  return (
    <div className="relative rounded-xl bg-white p-3">
      <svg viewBox={`0 0 ${n} ${n}`} className={size} shapeRendering="crispEdges" role="img" aria-label="Código QR de donación (muestra)">
        {cells.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#0b1324" />
        ))}
        {eye(0, 0)}
        {eye(n - 7, 0)}
        {eye(0, n - 7)}
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid h-11 w-11 place-items-center rounded-lg bg-noche-900">
          <LogoMark className="h-8 w-8" />
        </span>
      </span>
    </div>
  );
}
