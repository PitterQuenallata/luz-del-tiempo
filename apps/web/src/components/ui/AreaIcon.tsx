import { Baby, BookOpen, HeartPulse, Music, Radio, Users, type LucideProps } from "lucide-react";
import type { AreaIcon as Icon } from "../../api/types";

const ICONS = { health: HeartPulse, music: Music, bible: BookOpen, kids: Baby, family: Users, radio: Radio };

export function AreaIcon({ icon, ...props }: { icon: Icon } & LucideProps) {
  const C = ICONS[icon] ?? Radio;
  return <C {...props} />;
}
