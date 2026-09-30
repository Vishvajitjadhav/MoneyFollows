/**
 * MoneyFollows mark — single source of geometry for the React logo,
 * the favicon/PWA icons (scripts/generate-icons.ts) and PDF reports.
 *
 * Concept: an MF ligature. The M's right leg doubles as the F's stem,
 * and the F's top bar runs forward into a dot — the line *follows the money*.
 * Drawn on a 48×48 grid with a 5-unit round stroke so it holds up at 16px.
 */

export const BRAND = {
  coral: "#E85D5D",
  coralStrong: "#D44848",
  coralSoft: "#FFF1F1",
  ink: "#202020",
  white: "#FFFFFF",
  dark: "#121212",
} as const;

export const MARK_VIEWBOX = 48;
export const MARK_STROKE = 5;

/** M (left stem → valley → shared stem), F top bar, F middle bar. */
export const MARK_PATHS = ["M8 35V13l10 12 10-12h5", "M28 13v22", "M28 25h5"] as const;

/** The money the line follows. */
export const MARK_DOT = { cx: 39.75, cy: 13, r: 3.4 } as const;

/** Tile corner radius on the 48 grid (app-icon squircle feel). */
export const TILE_RADIUS = 13;

type MarkSvgOptions = {
  /** Mark color. */
  fg: string;
  /** Tile color; omit for a transparent, mark-only SVG. */
  bg?: string;
  /** Rounded tile (true) or full-bleed square (false, e.g. maskable icons). */
  rounded?: boolean;
  /** Mark scale inside the tile (maskable icons need ~0.72 for the safe zone). */
  scale?: number;
  size?: number;
};

/** Standalone SVG string of the mark, used for generated icon files. */
export function markSvg({ fg, bg, rounded = true, scale = 1, size = 48 }: MarkSvgOptions): string {
  const c = MARK_VIEWBOX / 2;
  const transform = scale === 1 ? "" : ` transform="translate(${c} ${c}) scale(${scale}) translate(${-c} ${-c})"`;
  const tile = bg
    ? `<rect width="48" height="48" rx="${rounded ? TILE_RADIUS : 0}" fill="${bg}"/>`
    : "";
  const paths = MARK_PATHS.map((d) => `<path d="${d}"/>`).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">` +
    tile +
    `<g${transform}>` +
    `<g fill="none" stroke="${fg}" stroke-width="${MARK_STROKE}" stroke-linecap="round" stroke-linejoin="round">${paths}</g>` +
    `<circle cx="${MARK_DOT.cx}" cy="${MARK_DOT.cy}" r="${MARK_DOT.r}" fill="${fg}"/>` +
    `</g></svg>`
  );
}
