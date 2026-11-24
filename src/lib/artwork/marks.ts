import type { Ctx } from "./context";
import { Pen, capsulePath, halfPath, linePath, place, quarterPath, roundRectPath, spanHalf } from "./geometry";
import type { Mark, Motion, Pose, Pt } from "./model";
import { SPOT, VIEWBOX, WASH_ALPHA_MAX } from "./model";
import { base, drift, enter, orbit, poseFor, pulse, slide, spin } from "./motion";
import { r, r3 } from "./numbers";

/* ---------------------------------------------------------------------------
   Marks.
   ------------------------------------------------------------------------ */

/** A soft brand field at the edge — the `.tds-wash` of this panel. */
export function field(ctx: Ctx): Mark {
  // On an edge, not in the middle: a tint behind the centre of the picture is a
  // haze, one at the edge is a light source.
  const edge = Math.floor(ctx.rng() * 4);
  const along = ctx.between(10, 90);
  const off = ctx.between(-8, 12);
  const cx = edge === 0 ? off : edge === 1 ? VIEWBOX - off : along;
  const cy = edge === 2 ? off : edge === 3 ? VIEWBOX - off : along;
  const blur = ctx.rng() < 0.5 ? 1 : 2;
  return base({
    kind: "circle",
    cx: r(cx),
    cy: r(cy),
    r: r(ctx.between(22, 36)),
    filled: true,
    at: [r(cx), r(cy)],
    hue: ctx.pick(ctx.hues),
    opacity: r3(Math.min(WASH_ALPHA_MAX, ctx.between(0.16, 0.3))),
    blur,
    layer: "wash",
    motion: drift(ctx),
    pose: poseFor(ctx, "wash"),
  });
}

/**
 * A big flat slab cut by the frame — "angeschnittene Formen": a disc on an
 * edge, or a quarter circle anchored just outside a corner with its rounded
 * corner facing in.
 */
export function slab(ctx: Ctx): Mark {
  const hue = ctx.pick(ctx.hues);
  const opacity = r3(ctx.between(0.11, 0.2));
  if (ctx.rng() < 0.5) {
    const corner = Math.floor(ctx.rng() * 4);
    const s = ctx.between(60, 82);
    const o = -18;
    // Square corner at `(o,o)` beyond the canvas corner; the rotation turns the
    // bottom-right rounding toward the centre from whichever corner it sits in.
    const cx = corner === 0 || corner === 3 ? o + s / 2 : VIEWBOX - o - s / 2;
    const cy = corner < 2 ? o + s / 2 : VIEWBOX - o - s / 2;
    const ax = corner === 0 || corner === 3 ? o : VIEWBOX - o;
    const ay = corner < 2 ? o : VIEWBOX - o;
    return base({
      kind: "path",
      d: quarterPath(place(cx, cy, corner * 90), s),
      filled: true,
      at: [ax, ay],
      hue,
      opacity,
      layer: "wash",
      motion: drift(ctx, 0.35),
      pose: poseFor(ctx, "wash"),
    });
  }
  const edge = Math.floor(ctx.rng() * 4);
  const along = ctx.between(20, 80);
  const off = ctx.between(-6, 8);
  const cx = edge === 0 ? off : edge === 1 ? VIEWBOX - off : along;
  const cy = edge === 2 ? off : edge === 3 ? VIEWBOX - off : along;
  return base({
    kind: "circle",
    cx: r(cx),
    cy: r(cy),
    r: r(ctx.between(24, 40)),
    filled: true,
    at: [r(cx), r(cy)],
    hue,
    opacity,
    layer: "wash",
    motion: drift(ctx, 0.5),
    pose: poseFor(ctx, "wash"),
  });
}

/** A great capsule crossing the whole frame — the "große Kapsel", cut at both ends. */
export function bigCapsule(ctx: Ctx): Mark {
  const deg = ctx.between(-35, 35);
  const cy = ctx.between(25, 75);
  const half = spanHalf(50, cy);
  const at = place(50, cy, deg);
  const thick = ctx.between(16, 26);
  return base({
    kind: "path",
    d: capsulePath(at, half * 2 + thick, thick),
    filled: true,
    spans: true,
    ends: [at([-half, 0]).map(r) as Pt, at([half, 0]).map(r) as Pt],
    at: [50, r(cy)],
    hue: ctx.pick(ctx.hues),
    opacity: r3(ctx.between(0.11, 0.17)),
    layer: "wash",
    motion: slide(ctx, Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180), 4, 9),
    pose: poseFor(ctx, "wash"),
  });
}

/** The tile vocabulary of `.tds-shape`, in local coordinates. */
export const TILE_FORMS = ["capsule", "quarter", "half", "rect", "disc"] as const;
export type TileForm = (typeof TILE_FORMS)[number];

/** A shadowed tile: solid colour, the hard 2D offset beneath it. */
export function tile(
  ctx: Ctx,
  cx: number,
  cy: number,
  size: number,
  form: TileForm,
  motion: (c: Ctx) => Motion,
  shade: number,
  delay: [number, number],
  shared?: Pose,
): Mark {
  const hue = ctx.rng() < 0.12 ? SPOT : ctx.pick(ctx.hues);
  const opacity = r3(ctx.between(0.82, 0.96));
  const quarterTurn = Math.floor(ctx.rng() * 4) * 90;
  const common = {
    filled: true,
    at: [r(cx), r(cy)] as Pt,
    hue,
    opacity,
    shade,
    layer: "structure" as const,
  };
  if (form === "disc") {
    return base({
      ...common,
      kind: "circle",
      cx: r(cx),
      cy: r(cy),
      r: r(size / 2),
      motion: motion(ctx),
      pose: shared ?? poseFor(ctx, "structure"),
      enter: enter(ctx, "pop", ...delay),
    });
  }
  const at = place(cx, cy, quarterTurn);
  const d =
    form === "capsule"
      ? capsulePath(at, size * 1.9, size * 0.8)
      : form === "quarter"
        ? quarterPath(at, size)
        : form === "half"
          ? halfPath(at, size)
          : roundRectPath(at, size, size, size * 0.28);
  return base({
    ...common,
    kind: "path",
    d,
    motion: motion(ctx),
    pose: poseFor(ctx, "structure"),
    enter: enter(ctx, "pop", ...delay),
  });
}

/** A hairline ring. */
export function ring(ctx: Ctx, cx = ctx.between(15, 85), cy = ctx.between(15, 85), rad = ctx.between(8, 30)): Mark {
  return base({
    kind: "circle",
    cx: r(cx),
    cy: r(cy),
    r: r(rad),
    at: [r(cx), r(cy)],
    hue: ctx.pick(ctx.hues),
    width: r3(ctx.between(0.3, 0.5)),
    opacity: r3(ctx.between(0.2, 0.42)),
    layer: "structure",
    motion: orbit(ctx),
    pose: poseFor(ctx, "structure"),
    enter: enter(ctx, "pop", 150, 700),
  });
}

/** An arc segment cut from a circle about (`fx`,`fy`), turning on that centre. */
export function arc(ctx: Ctx, fx: number, fy: number, radius: number): Mark {
  const a0 = ctx.rng() * Math.PI * 2;
  const da = ctx.between(0.6, 2.6);
  const a1 = a0 + da;
  const d =
    `M ${r(fx + radius * Math.cos(a0))} ${r(fy + radius * Math.sin(a0))} ` +
    `A ${r(radius)} ${r(radius)} 0 ${da > Math.PI ? 1 : 0} 1 ` +
    `${r(fx + radius * Math.cos(a1))} ${r(fy + radius * Math.sin(a1))}`;
  const mid = (a0 + a1) / 2;
  return base({
    kind: "path",
    d,
    at: [r(fx + radius * Math.cos(mid)), r(fy + radius * Math.sin(mid))],
    hue: ctx.pick(ctx.hues),
    width: r3(ctx.between(0.35, 0.8)),
    opacity: r3(ctx.between(0.3, 0.6)),
    measured: true,
    layer: "structure",
    motion: spin(ctx, fx, fy),
    pose: poseFor(ctx, "structure"),
    enter: enter(ctx, "draw", 100, 800),
  });
}

/** A crisp dot. `spot` forces the gold of a node. */
export function dot(
  ctx: Ctx,
  cx = ctx.between(12, 88),
  cy = ctx.between(12, 88),
  rad = ctx.between(0.6, 1.8),
  motion: (c: Ctx) => Motion = (c) => pulse(c),
  spot = false,
  delay: [number, number] = [600, 1200],
): Mark {
  return base({
    kind: "circle",
    cx: r(cx),
    cy: r(cy),
    r: r(rad),
    filled: true,
    at: [r(cx), r(cy)],
    hue: spot || ctx.rng() < 0.35 ? SPOT : ctx.pick(ctx.hues),
    opacity: r3(ctx.between(0.6, 0.94)),
    layer: "accent",
    motion: motion(ctx),
    pose: poseFor(ctx, "accent"),
    enter: enter(ctx, "pop", ...delay),
  });
}

/** A registration cross — the tailor's chalk mark on a pattern. */
export function cross(ctx: Ctx): Mark {
  const cx = ctx.between(14, 86);
  const cy = ctx.between(14, 86);
  const s = ctx.between(1.6, 3);
  const d = `${linePath([cx - s, cy], [cx + s, cy])} ${linePath([cx, cy - s], [cx, cy + s])}`;
  return base({
    kind: "path",
    d,
    at: [r(cx), r(cy)],
    hue: ctx.rng() < 0.5 ? SPOT : ctx.pick(ctx.hues),
    width: r3(ctx.between(0.35, 0.55)),
    opacity: r3(ctx.between(0.55, 0.9)),
    layer: "accent",
    motion: pulse(ctx),
    pose: poseFor(ctx, "accent"),
    enter: enter(ctx, "pop", 500, 1200),
  });
}

/**
 * A straight run crossing the whole frame along `deg` through (`cx`,`cy`), out
 * to OVERHANG at both ends.
 */
export function spanLine(
  cx: number,
  cy: number,
  deg: number,
): { d: string; ends: [Pt, Pt]; ux: number; uy: number } {
  const half = spanHalf(cx, cy);
  const at = place(cx, cy, deg);
  const a = at([-half, 0]).map(r) as Pt;
  const b = at([half, 0]).map(r) as Pt;
  const rad = (deg * Math.PI) / 180;
  return { d: linePath(a, b), ends: [a, b], ux: Math.cos(rad), uy: Math.sin(rad) };
}

/**
 * The logomark's diagonal cut: ONE steep hairline at the mark's angle (72°, i.e.
 * the 18° skew of `.tds-shape--diagonal`), crossing the frame top to bottom.
 */
export function diagonal(ctx: Ctx): Mark {
  const cx = ctx.between(22, 78);
  const { d, ends, ux, uy } = spanLine(cx, 50, ctx.rng() < 0.5 ? 72 : 108);
  return base({
    kind: "path",
    d,
    spans: true,
    ends,
    at: [r(cx), 50],
    hue: ctx.pick(ctx.hues),
    width: r3(ctx.between(0.35, 0.6)),
    opacity: r3(ctx.between(0.35, 0.6)),
    measured: true,
    layer: "structure",
    // Across its own axis: along it, an infinite line does not visibly move.
    motion: slide(ctx, -uy, ux, 2, 5),
    pose: poseFor(ctx, "structure", true),
    enter: enter(ctx, "draw", 0, 500),
  });
}

/**
 * A tape-measure rule: a spanning baseline with ticks every `step`, a long one
 * every fifth. One path, so a hundred ticks cost one node.
 */
export function ruler(ctx: Ctx, cx: number, cy: number, deg: number): Mark {
  const half = spanHalf(cx, cy);
  const step = ctx.between(2.2, 3.4);
  const at = place(cx, cy, deg);
  const pen = new Pen(at);
  pen.m(-half, 0).l(half, 0);
  const n = Math.floor((half * 2) / step);
  for (let i = 0; i <= n; i++) {
    const x = -half + i * step;
    const long = i % 5 === 0;
    pen.m(x, 0).l(x, long ? -3.2 : -1.6);
  }
  const rad = (deg * Math.PI) / 180;
  const ux = Math.cos(rad);
  const uy = Math.sin(rad);
  const tape = base({
    kind: "path",
    d: pen.toString(),
    spans: true,
    ends: [at([-half, 0]).map(r) as Pt, at([half, 0]).map(r) as Pt],
    at: [r(cx), r(cy)],
    hue: ctx.pick([...ctx.hues, SPOT]),
    width: r3(ctx.between(0.3, 0.45)),
    opacity: r3(ctx.between(0.4, 0.65)),
    layer: "structure",
    // The tape pays out and draws back along itself, by whole ticks or not.
    motion: slide(ctx, ux, uy, 3, 9),
    pose: poseFor(ctx, "structure", true),
    enter: enter(ctx, "fade", 0, 400),
  });
  // A keystroke pays out exactly one MAJOR unit (five ticks): the pattern is
  // periodic in that length, so the snap back when the burst ends is invisible.
  ctx.keys.push([{ mark: tape, act: "advance", dx: ux * step * 5, dy: uy * step * 5 }]);
  return tape;
}
