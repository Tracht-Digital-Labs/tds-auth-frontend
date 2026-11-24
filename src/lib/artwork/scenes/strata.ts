import type { Ctx } from "../context";
import { capsulePath, linePath, place, spanHalf } from "../geometry";
import { dot, field, slab } from "../marks";
import type { Mark, Pt } from "../model";
import { SPOT } from "../model";
import { base, enter, poseFor, shadeOf, slide } from "../motion";
import { r, r3 } from "../numbers";

export function strataScene(ctx: Ctx): Mark[] {
  const marks: Mark[] = [field(ctx)];
  if (ctx.rng() < 0.5) marks.push(slab(ctx));

  // One angle for the whole scene — parallel is the entire idea.
  const deg = ctx.between(-28, 28);
  const rad = (deg * Math.PI) / 180;
  const ux = Math.cos(rad);
  const uy = Math.sin(rad);
  const bands = Math.floor(ctx.between(5, 8.99));
  // Evenly spread with jitter: a purely random offset leaves gaps and clusters.
  const step = 120 / bands;
  const shade = shadeOf(ctx);
  // At least one band is solid: a scene of panes alone has no shadow at all.
  const keystone = Math.floor(ctx.rng() * bands);
  for (let i = 0; i < bands; i++) {
    const off = -60 + (i + ctx.between(0.2, 0.8)) * step;
    // Offset across the axis from the canvas centre.
    const cx = 50 - uy * off;
    const cy = 50 + ux * off;
    const at = place(cx, cy, deg);
    const half = spanHalf(cx, cy);
    const thick = ctx.between(2.5, 9);
    // Some bands are solid and cast the hard shadow; the rest are translucent
    // panes the solid ones lie on.
    const solid = ctx.rng() < 0.4 || i === keystone;
    marks.push(
      base({
        kind: "path",
        d: capsulePath(at, half * 2 + thick, thick),
        filled: true,
        spans: true,
        ends: [at([-half, 0]).map(r) as Pt, at([half, 0]).map(r) as Pt],
        at: [r(cx), r(cy)],
        hue: ctx.pick(ctx.hues),
        opacity: solid ? r3(ctx.between(0.82, 0.94)) : r3(ctx.between(0.18, 0.4)),
        shade: solid ? shade : 0,
        layer: "structure",
        motion: slide(ctx, ux, uy, 5, 12),
        pose: poseFor(ctx, "structure", true),
        enter: enter(ctx, "fade", i * 90, i * 90 + 120),
      }),
    );
  }

  // Three is the floor: two cross-ticks read as stray scratches, three as a
  // deliberate cross-hatch. Perpendicular to the bands.
  const ticks = Math.floor(ctx.between(3, 5.99));
  for (let i = 0; i < ticks; i++) {
    const cx = ctx.between(25, 75);
    const cy = ctx.between(25, 75);
    const len = ctx.between(8, 22);
    marks.push(
      base({
        kind: "path",
        d: linePath([cx + uy * len, cy - ux * len], [cx - uy * len, cy + ux * len]),
        at: [r(cx), r(cy)],
        hue: ctx.pick([...ctx.hues, SPOT]),
        width: r3(ctx.between(0.3, 0.6)),
        opacity: r3(ctx.between(0.3, 0.55)),
        measured: true,
        layer: "structure",
        motion: slide(ctx, ux, uy, 4, 10),
        pose: poseFor(ctx, "structure"),
        enter: enter(ctx, "draw", 700, 1100),
      }),
    );
  }

  const dots = Math.floor(ctx.between(2, 4.99));
  for (let i = 0; i < dots; i++) marks.push(dot(ctx));
  let sign = 1;
  for (const mark of marks) {
    if (!mark.spans || mark.motion.kind !== "slide") continue;
    const len = Math.hypot(mark.motion.dx, mark.motion.dy) || 1;
    ctx.keys.push([
      { mark, act: "shove", dx: (sign * 7 * mark.motion.dx) / len, dy: (sign * 7 * mark.motion.dy) / len },
    ]);
    sign = -sign;
  }
  return marks;
}
