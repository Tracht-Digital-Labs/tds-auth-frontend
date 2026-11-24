import type { Pose, Pt } from "./model";
import { OVERHANG, POSE_DELAY_MAX, VIEWBOX } from "./model";
import { clamp, r } from "./numbers";

/* ---------------------------------------------------------------------------
   Geometry. Every shape is built in local coordinates about (0,0) and placed
   with one rotation + translation; circular arcs survive a rotation unchanged,
   so nothing here needs a `transform` attribute (which the hover CSS would
   override on an accent).
   ------------------------------------------------------------------------ */

export type Place = (p: Pt) => Pt;

export function place(cx: number, cy: number, deg = 0): Place {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return ([x, y]) => [cx + x * c - y * s, cy + x * s + y * c];
}

/** A tiny path writer: M / L / circular A / Z, every point through `at`. */
export class Pen {
  private parts: string[] = [];
  constructor(private readonly at: Place = (p) => p) {}
  m(x: number, y: number) {
    const [a, b] = this.at([x, y]);
    this.parts.push(`M ${r(a)} ${r(b)}`);
    return this;
  }
  l(x: number, y: number) {
    const [a, b] = this.at([x, y]);
    this.parts.push(`L ${r(a)} ${r(b)}`);
    return this;
  }
  a(radius: number, large: 0 | 1, sweep: 0 | 1, x: number, y: number) {
    const [a, b] = this.at([x, y]);
    this.parts.push(`A ${r(radius)} ${r(radius)} 0 ${large} ${sweep} ${r(a)} ${r(b)}`);
    return this;
  }
  z() {
    this.parts.push("Z");
    return this;
  }
  toString() {
    return this.parts.join(" ");
  }
}

/** A capsule `w` long and `h` thick (w >= h), centred on the origin. */
export function capsulePath(at: Place, w: number, h: number): string {
  const rr = h / 2;
  const hw = Math.max(0, w / 2 - rr);
  return new Pen(at)
    .m(-hw, -rr)
    .l(hw, -rr)
    .a(rr, 0, 1, hw, rr)
    .l(-hw, rr)
    .a(rr, 0, 1, -hw, -rr)
    .z()
    .toString();
}

/** A rectangle with corner radius `rad`, centred on the origin. */
export function roundRectPath(at: Place, w: number, h: number, rad: number): string {
  const x = w / 2;
  const y = h / 2;
  const k = Math.min(rad, x, y);
  return new Pen(at)
    .m(-x + k, -y)
    .l(x - k, -y)
    .a(k, 0, 1, x, -y + k)
    .l(x, y - k)
    .a(k, 0, 1, x - k, y)
    .l(-x + k, y)
    .a(k, 0, 1, -x, y - k)
    .l(-x, -y + k)
    .a(k, 0, 1, -x + k, -y)
    .z()
    .toString();
}

/**
 * A quarter circle: a square of side `s` whose bottom-right corner is fully
 * rounded, centred on the origin. The rotation picks which corner rounds — the
 * same "the suffix names the rounded corner" rule as `.tds-shape--quarter-*`.
 */
export function quarterPath(at: Place, s: number): string {
  const h = s / 2;
  return new Pen(at).m(-h, -h).l(h, -h).a(s, 0, 1, -h, h).z().toString();
}

/** A half disc of diameter `s`, flat side down, centred on its bounding box. */
export function halfPath(at: Place, s: number): string {
  const R = s / 2;
  return new Pen(at)
    .m(-R, R / 2)
    .a(R, 0, 1, R, R / 2)
    .z()
    .toString();
}

/**
 * An orthogonal run through `pts` with every corner rounded to `rc` — the
 * conduit line of `.tds-circuit`, never a sharp elbow.
 */
export function conduitPath(pts: Pt[], rc: number): string {
  const pen = new Pen();
  pen.m(pts[0]![0], pts[0]![1]);
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1]!;
    const [x, y] = pts[i]!;
    const [nx, ny] = pts[i + 1]!;
    const inLen = Math.hypot(x - px, y - py);
    const outLen = Math.hypot(nx - x, ny - y);
    const k = Math.min(rc, inLen / 2, outLen / 2);
    const d1: Pt = [(x - px) / inLen, (y - py) / inLen];
    const d2: Pt = [(nx - x) / outLen, (ny - y) / outLen];
    // Screen coordinates (y down): a positive cross product is a clockwise turn.
    const sweep = d1[0] * d2[1] - d1[1] * d2[0] > 0 ? 1 : 0;
    pen.l(x - d1[0] * k, y - d1[1] * k).a(k, 0, sweep, x + d2[0] * k, y + d2[1] * k);
  }
  const last = pts[pts.length - 1]!;
  pen.l(last[0], last[1]);
  return pen.toString();
}

/** A straight line from `a` to `b`. */
export function linePath(a: Pt, b: Pt): string {
  return new Pen().m(a[0], a[1]).l(b[0], b[1]).toString();
}

/**
 * Half-length of a spanning mark centred on (`cx`,`cy`), at ANY angle: long
 * enough that both ends sit OVERHANG past the frame on the worst (diagonal)
 * heading, from wherever the mark is centred. Over-long is free; short shows a cap.
 */
export function spanHalf(cx: number, cy: number): number {
  return (VIEWBOX / 2 + OVERHANG) * Math.SQRT2 + Math.hypot(cx - 50, cy - 50);
}

/** A pose shared by marks that must move as one piece, staggered by `t` in [0, 1]. */
export function staggered(pose: Pose, t: number): Pose {
  return { ...pose, delay: Math.round(clamp(t, 0, 1) * POSE_DELAY_MAX) };
}
