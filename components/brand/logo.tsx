import { cn } from "@/lib/utils";
import { MARK_DOT, MARK_PATHS, MARK_STROKE, TILE_RADIUS } from "./mark";

type MarkVariant =
  /** Coral tile, white mark — app icon look (default). */
  | "tile"
  /** Mark only, in coral. */
  | "coral"
  /** Mark only, inherits text color (monochrome, works on any background). */
  | "mono";

type LogoMarkProps = {
  variant?: MarkVariant;
  /** Pixel size (width = height). */
  size?: number;
  className?: string;
  title?: string;
};

export function LogoMark({ variant = "tile", size = 32, className, title }: LogoMarkProps) {
  const fg = variant === "tile" ? "#FFFFFF" : variant === "coral" ? "var(--brand)" : "currentColor";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={cn("shrink-0", className)}
    >
      {variant === "tile" && <rect width="48" height="48" rx={TILE_RADIUS} fill="var(--brand)" />}
      <g fill="none" stroke={fg} strokeWidth={MARK_STROKE} strokeLinecap="round" strokeLinejoin="round">
        {MARK_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <circle cx={MARK_DOT.cx} cy={MARK_DOT.cy} r={MARK_DOT.r} fill={fg} />
    </svg>
  );
}

const SIZES = {
  sm: { mark: 24, text: "text-base", gap: "gap-2" },
  md: { mark: 32, text: "text-xl", gap: "gap-2.5" },
  lg: { mark: 44, text: "text-3xl", gap: "gap-3" },
} as const;

type LogoProps = {
  size?: keyof typeof SIZES;
  /** "brand" = coral accents; "mono" = single color (inherits text color). */
  tone?: "brand" | "mono";
  /** Hide the wordmark below a breakpoint by passing e.g. "hidden sm:inline". */
  wordmarkClassName?: string;
  className?: string;
};

/** Horizontal lockup: mark + "MoneyFollows". Text color follows the surrounding theme. */
export function Logo({ size = "md", tone = "brand", wordmarkClassName, className }: LogoProps) {
  const s = SIZES[size];
  return (
    <span className={cn("inline-flex items-center", s.gap, className)}>
      <LogoMark size={s.mark} variant={tone === "mono" ? "mono" : "tile"} />
      <span className={cn("font-bold tracking-[-0.03em] leading-none", s.text, wordmarkClassName)}>
        Money<span className={tone === "brand" ? "text-brand" : undefined}>Follows</span>
      </span>
    </span>
  );
}
