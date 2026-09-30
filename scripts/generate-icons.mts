/**
 * Generates every raster/SVG brand asset from components/brand/mark.ts.
 * Run after changing the mark:  npm run icons
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { BRAND, markSvg, MARK_DOT, MARK_PATHS, MARK_STROKE, TILE_RADIUS } from "../components/brand/mark.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = (p: string) => join(root, p);

async function png(svg: string, size: number, file: string) {
  await mkdir(dirname(out(file)), { recursive: true });
  await sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png().toFile(out(file));
}

async function svgFile(svg: string, file: string) {
  await mkdir(dirname(out(file)), { recursive: true });
  await writeFile(out(file), svg + "\n");
}

/** ICO container with embedded PNGs (supported by every modern browser). */
async function ico(svg: string, sizes: number[], file: string) {
  const images = await Promise.all(
    sizes.map((s) => sharp(Buffer.from(svg), { density: 384 }).resize(s, s).png().toBuffer()),
  );
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries: Buffer[] = [];
  let offset = 6 + 16 * images.length;
  images.forEach((img, i) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 0);
    e.writeUInt8(sizes[i] >= 256 ? 0 : sizes[i], 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(img.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += img.length;
    entries.push(e);
  });
  await writeFile(out(file), Buffer.concat([header, ...entries, ...images]));
}

/** Horizontal lockup: tile + "MoneyFollows" wordmark. */
function lockupSvg(theme: "light" | "dark" | "mono"): string {
  const tileBg = theme === "mono" ? BRAND.ink : BRAND.coral;
  const money = theme === "dark" ? BRAND.white : BRAND.ink;
  const follows = theme === "mono" ? BRAND.ink : BRAND.coral;
  const paths = MARK_PATHS.map((d) => `<path d="${d}"/>`).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="264" height="48" viewBox="0 0 264 48">` +
    `<rect width="48" height="48" rx="${TILE_RADIUS}" fill="${tileBg}"/>` +
    `<g fill="none" stroke="${BRAND.white}" stroke-width="${MARK_STROKE}" stroke-linecap="round" stroke-linejoin="round">${paths}</g>` +
    `<circle cx="${MARK_DOT.cx}" cy="${MARK_DOT.cy}" r="${MARK_DOT.r}" fill="${BRAND.white}"/>` +
    `<text x="60" y="33.5" font-family="Inter, 'Segoe UI', system-ui, sans-serif" font-size="26" font-weight="700" letter-spacing="-0.7">` +
    `<tspan fill="${money}">Money</tspan><tspan fill="${follows}">Follows</tspan></text>` +
    `</svg>`
  );
}

const tile = markSvg({ fg: BRAND.white, bg: BRAND.coral });
const fullBleed = markSvg({ fg: BRAND.white, bg: BRAND.coral, rounded: false, scale: 0.78 });
const maskable = markSvg({ fg: BRAND.white, bg: BRAND.coral, rounded: false, scale: 0.66 });

await Promise.all([
  // Next.js file-convention icons (auto-linked in <head>)
  svgFile(tile, "app/icon.svg"),
  ico(tile, [16, 32, 48], "app/favicon.ico"),
  png(fullBleed, 180, "app/apple-icon.png"),

  // PWA icons (manifest — PLAN.md Phase 8)
  png(tile, 192, "public/icons/icon-192.png"),
  png(tile, 512, "public/icons/icon-512.png"),
  png(maskable, 512, "public/icons/maskable-512.png"),

  // Brand kit
  svgFile(tile, "public/brand/mark.svg"),
  svgFile(markSvg({ fg: BRAND.coral }), "public/brand/mark-coral.svg"),
  svgFile(markSvg({ fg: BRAND.ink }), "public/brand/mark-mono.svg"),
  svgFile(markSvg({ fg: BRAND.white }), "public/brand/mark-white.svg"),
  svgFile(markSvg({ fg: BRAND.coral, bg: BRAND.dark }), "public/brand/mark-dark.svg"),
  svgFile(lockupSvg("light"), "public/brand/logo-light.svg"),
  svgFile(lockupSvg("dark"), "public/brand/logo-dark.svg"),
  svgFile(lockupSvg("mono"), "public/brand/logo-mono.svg"),
  png(tile, 1024, "public/brand/mark-1024.png"),
]);

console.log("✓ Brand assets generated");
