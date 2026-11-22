/**
 * Logo elegido por el ministerio (globo dorado con tres ángeles).
 * `logo.png` es la versión transparente sacada de `logo-negro.webp`;
 * cuando el diseñador entregue el SVG oficial, basta con cambiar el `src`.
 */
export function LogoMark({ className = "h-11 w-11", sizes = "56px" }: { className?: string; sizes?: string }) {
  // Versiones chicas en WebP: el PNG de 512 px pesa 108 KB y casi siempre se muestra a menos de 60 px.
  return (
    <img
      src="/brand/logo-192.webp"
      srcSet="/brand/logo-96.webp 96w, /brand/logo-192.webp 192w, /brand/logo.png 512w"
      sizes={sizes}
      width={96}
      height={96}
      alt=""
      decoding="async"
      className={`${className} shrink-0 object-contain`}
      draggable={false}
    />
  );
}

const SIZES = {
  sm: { top: "text-[15px]", bottom: "text-[7.5px] tracking-[0.42em]", gap: "gap-0.5" },
  md: { top: "text-[21px]", bottom: "text-[10px] tracking-[0.42em]", gap: "gap-1" },
  lg: { top: "text-[34px]", bottom: "text-[15px] tracking-[0.44em]", gap: "gap-1.5" },
  xl: { top: "text-[clamp(40px,6vw,68px)]", bottom: "text-[clamp(15px,2.25vw,25px)] tracking-[0.45em]", gap: "gap-2" },
} as const;

/**
 * Nombre en dos niveles, todo en mayúsculas: LA LUZ grande y DEL TIEMPO
 * espaciado en dorado. El espaciado de abajo está calculado para que ocupe
 * el mismo ancho que LA LUZ.
 */
export function Wordmark({ size = "md", className = "" }: { size?: keyof typeof SIZES; className?: string }) {
  const s = SIZES[size];
  return (
    <span className={`inline-flex flex-col leading-none ${s.gap} ${className}`}>
      <span className={`titulo tracking-[0.04em] whitespace-nowrap uppercase ${s.top}`}>La Luz</span>
      <span className={`font-semibold whitespace-nowrap text-oro-500 uppercase ${s.bottom}`}>Del Tiempo</span>
    </span>
  );
}

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const big = size === "lg";
  return (
    <span className="flex items-center gap-2.5" role="img" aria-label="La Luz del Tiempo">
      <LogoMark className={big ? "h-20 w-20" : "h-12 w-12"} sizes={big ? "80px" : "48px"} />
      <Wordmark size={big ? "lg" : "md"} />
    </span>
  );
}
