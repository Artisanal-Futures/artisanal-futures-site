/**
 * Generates the map-pin icon as a signed distance field (SDF) so that its
 * fill (`icon-color`) and outline (`icon-halo-*`) are *paint* properties and
 * can therefore be driven by feature-state (hover / selected) and theme.
 *
 * Geometry is defined in CSS pixels and rasterised at PIN_PIXEL_RATIO.
 * Distances are encoded MapLibre-style: alpha = 0.75 - d / 8 (d in CSS px,
 * negative inside), so 1 unit of `icon-halo-width` ≈ 1 CSS px at icon-size 1.
 *
 * The centre "hole" is encoded as being just outside the shape (≤ 0.75px),
 * so any halo wider than that fills it — giving a solid centre dot in the
 * halo colour without needing a second layer.
 */

export const PIN_IMAGE_ID = "artisan-pin";
export const PIN_PIXEL_RATIO = 2;

/** Icon canvas, CSS px. */
export const PIN_WIDTH = 30;
export const PIN_HEIGHT = 40;

const HEAD = { x: 15, y: 14 };
const HEAD_RADIUS = 10.5;
const TIP = { x: 15, y: 37 };
const HOLE_RADIUS = 4;
const HOLE_CAP = 0.75;

/** Distance (CSS px) from the icon's bottom edge to the pin tip. */
export const PIN_TIP_INSET = PIN_HEIGHT - TIP.y;
/** Distance (CSS px) from the pin tip to the top of the pin head. */
export const PIN_VISUAL_HEIGHT = TIP.y - (HEAD.y - HEAD_RADIUS);

type V = { x: number; y: number };
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y });
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y;
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v));

// Inigo Quilez' exact triangle SDF.
function sdTriangle(p: V, p0: V, p1: V, p2: V): number {
  const e0 = sub(p1, p0);
  const e1 = sub(p2, p1);
  const e2 = sub(p0, p2);
  const v0 = sub(p, p0);
  const v1 = sub(p, p1);
  const v2 = sub(p, p2);
  const proj = (v: V, e: V) => {
    const t = clamp(dot(v, e) / dot(e, e), 0, 1);
    return { x: v.x - e.x * t, y: v.y - e.y * t };
  };
  const pq0 = proj(v0, e0);
  const pq1 = proj(v1, e1);
  const pq2 = proj(v2, e2);
  const s = Math.sign(e0.x * e2.y - e0.y * e2.x);
  const c0 = [dot(pq0, pq0), s * (v0.x * e0.y - v0.y * e0.x)] as const;
  const c1 = [dot(pq1, pq1), s * (v1.x * e1.y - v1.y * e1.x)] as const;
  const c2 = [dot(pq2, pq2), s * (v2.x * e2.y - v2.y * e2.x)] as const;
  const dx = Math.min(c0[0], c1[0], c2[0]);
  const dy = Math.min(c0[1], c1[1], c2[1]);
  return -Math.sqrt(dx) * Math.sign(dy);
}

function tangentPoints(): [V, V] {
  const d = Math.hypot(TIP.x - HEAD.x, TIP.y - HEAD.y);
  const ux = (TIP.x - HEAD.x) / d;
  const uy = (TIP.y - HEAD.y) / d;
  const a = Math.acos(HEAD_RADIUS / d);
  const rot = (ang: number): V => ({
    x: HEAD.x + HEAD_RADIUS * (ux * Math.cos(ang) - uy * Math.sin(ang)),
    y: HEAD.y + HEAD_RADIUS * (ux * Math.sin(ang) + uy * Math.cos(ang)),
  });
  return [rot(a), rot(-a)];
}

function pinDistance(p: V, t1: V, t2: V): number {
  const dHead = Math.hypot(p.x - HEAD.x, p.y - HEAD.y) - HEAD_RADIUS;
  const dTail = sdTriangle(p, TIP, t1, t2);
  const dTear = Math.min(dHead, dTail);
  const dHole = Math.hypot(p.x - HEAD.x, p.y - HEAD.y) - HOLE_RADIUS;
  if (dHole < 0) return Math.min(-dHole, HOLE_CAP);
  return dTear;
}

let cached: { width: number; height: number; data: Uint8Array } | null = null;

/** RGBA SDF image for `map.addImage(PIN_IMAGE_ID, img, { sdf: true, pixelRatio })`. */
export function createPinImage() {
  if (cached) return cached;
  const width = PIN_WIDTH * PIN_PIXEL_RATIO;
  const height = PIN_HEIGHT * PIN_PIXEL_RATIO;
  const data = new Uint8Array(width * height * 4);
  const [t1, t2] = tangentPoints();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const p = {
        x: (x + 0.5) / PIN_PIXEL_RATIO,
        y: (y + 0.5) / PIN_PIXEL_RATIO,
      };
      const d = pinDistance(p, t1, t2);
      const alpha = clamp(0.75 - d / 8, 0, 1);
      const i = (y * width + x) * 4;
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = Math.round(alpha * 255);
    }
  }
  cached = { width, height, data };
  return cached;
}
