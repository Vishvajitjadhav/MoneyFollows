import {
  Briefcase,
  ChartPie,
  CircleDashed,
  Clapperboard,
  Car,
  Gift,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  House,
  Landmark,
  Laptop,
  Lock,
  PawPrint,
  Receipt,
  Repeat,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Sprout,
  Star,
  TrendingUp,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryColor } from "@/lib/constants/categories";

/** Icon keys stored in `categories.icon`. Unknown keys fall back to "other". */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  food: UtensilsCrossed,
  transport: Car,
  housing: House,
  bills: Receipt,
  family: HeartHandshake,
  lifestyle: Sparkles,
  shopping: ShoppingBag,
  entertainment: Clapperboard,
  health: HeartPulse,
  education: GraduationCap,
  pets: PawPrint,
  other: CircleDashed,
  salary: Briefcase,
  freelance: Laptop,
  "side-income": Zap,
  bonus: Star,
  gift: Gift,
  refund: RotateCcw,
  sip: Repeat,
  "mutual-fund": ChartPie,
  stocks: TrendingUp,
  ppf: Landmark,
  fd: Lock,
  growth: Sprout,
};

/** Soft tint background + saturated foreground per color key. */
export const CATEGORY_COLORS: Record<CategoryColor, { bg: string; fg: string; solid: string }> = {
  coral: { bg: "#FFF1F1", fg: "#D44848", solid: "#E85D5D" },
  orange: { bg: "#FFF3E8", fg: "#D2691E", solid: "#F08A3E" },
  amber: { bg: "#FFF7E0", fg: "#B7800C", solid: "#E9A23B" },
  lime: { bg: "#F3F9E3", fg: "#5E8A12", solid: "#8BBF2C" },
  green: { bg: "#EAF7F0", fg: "#1F8A5E", solid: "#1F9D6B" },
  teal: { bg: "#E6F6F5", fg: "#15857E", solid: "#20A39B" },
  sky: { bg: "#E8F5FD", fg: "#1C7FB8", solid: "#3AA0DC" },
  blue: { bg: "#EAF0FF", fg: "#3561D6", solid: "#4D7BF3" },
  indigo: { bg: "#EEF0FE", fg: "#4B59D9", solid: "#5B6CF0" },
  violet: { bg: "#F3EEFC", fg: "#7C4FC4", solid: "#9B6BD6" },
  pink: { bg: "#FDEEF5", fg: "#C2447F", solid: "#E0649E" },
  slate: { bg: "#F1F2F4", fg: "#5B6270", solid: "#8A909C" },
};

export function getCategoryColor(color: string | null | undefined) {
  return CATEGORY_COLORS[(color as CategoryColor) ?? "slate"] ?? CATEGORY_COLORS.slate;
}

const SIZES = {
  sm: { box: "size-8 rounded-lg", icon: "size-4" },
  md: { box: "size-10 rounded-xl", icon: "size-5" },
  lg: { box: "size-12 rounded-2xl", icon: "size-6" },
} as const;

type CategoryIconProps = {
  icon: string | null | undefined;
  color: string | null | undefined;
  size?: keyof typeof SIZES;
  className?: string;
};

export function CategoryIcon({ icon, color, size = "md", className }: CategoryIconProps) {
  const Icon = CATEGORY_ICONS[icon ?? "other"] ?? CATEGORY_ICONS.other;
  const palette = getCategoryColor(color);
  const s = SIZES[size];

  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 items-center justify-center", s.box, className)}
      style={{ backgroundColor: palette.bg, color: palette.fg }}
    >
      <Icon className={s.icon} strokeWidth={1.9} />
    </span>
  );
}
