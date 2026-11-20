/** Filtros tipo píldora (áreas, tipos, emisoras, días). */
export function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`min-h-10 shrink-0 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors ${
            value === o.id ? "border-oro-500 bg-oro-500 text-noche-900" : "border-white/10 text-niebla-200 hover:border-oro-500/60 hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
