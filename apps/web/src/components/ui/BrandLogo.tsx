import type { SimpleIcon } from "simple-icons";

/** Logo real de una marca (simple-icons), en su color oficial o en el color que se pase. */
export function BrandLogo({ icon, className = "h-8 w-8", color }: { icon: SimpleIcon; className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} role="img" aria-label={icon.title} fill={color ?? `#${icon.hex}`}>
      <path d={icon.path} />
    </svg>
  );
}
