import type { Ctx } from "../context";
import { pressKeys } from "../context";
import { capsulePath, place, staggered } from "../geometry";
import { TILE_FORMS, cross, diagonal, dot, field, ruler, slab, tile } from "../marks";
import type { Mark } from "../model";
import { BRAND_ACCENT, BRAND_CORAL, SPOT } from "../model";
import { base, bob, enter, poseFor, pulse, shadeOf } from "../motion";
import { r } from "../numbers";

export function measureScene(ctx: Ctx): Mark[] {
  const marks: Mark[] = [field(ctx), slab(ctx)];

  // One or two tapes, parallel or crossing at a right angle — a cutting table.
  const deg = ctx.between(-20, 20);
  const tapes = ctx.rng() < 0.5 ? 1 : 2;
  marks.push(ruler(ctx, 50, ctx.between(28, 72), deg));
  if (tapes === 2) {
    const crossing = ctx.rng() < 0.5;
    marks.push(
      crossing ? ruler(ctx, ctx.between(28, 72), 50, deg + 90) : ruler(ctx, 50, ctx.between(28, 72), deg),
    );
  }

  marks.push(diagonal(ctx));

  // A dimension line between two crosses: the measurement being taken.
  const shade = shadeOf(ctx);
  const tiles = Math.floor(ctx.between(1, 2.99));
  for (let i = 0; i < tiles; i++) {
    marks.push(
      tile(
        ctx,
        ctx.between(20, 80),
        ctx.between(20, 80),
        ctx.between(9, 15),
        ctx.pick(TILE_FORMS),
        bob,
        shade,
        [500, 900],
      ),
    );
  }

  const crosses = Math.floor(ctx.between(3, 5.99));
  for (let i = 0; i < crosses; i++) marks.push(cross(ctx));

  // The brand accent: bordeaux · coral · gold, 42 : 20 : 12 with a gap, as
  // three capsules — punctuation, so exactly one, and only here.
  const bx = ctx.between(18, 58);
  const by = ctx.between(18, 82);
  const unit = ctx.between(0.42, 0.62);
  const thick = ctx.between(1.6, 2.4);
  const segs: Array<[number, string]> = [
    [42 * unit, BRAND_ACCENT],
    [20 * unit, BRAND_CORAL],
    [12 * unit, SPOT],
  ];
  let x = bx;
  const barMotion = pulse(ctx, 0.78, 0.92);
  const barPose = poseFor(ctx, "accent");
  segs.forEach(([len, hue], i) => {
    const cx = x + len / 2;
    marks.push(
      base({
        kind: "path",
        d: capsulePath(place(cx, by), len, thick),
        filled: true,
        at: [r(cx), r(by)],
        hue,
        opacity: 0.94,
        shade: r(shade * 0.6),
        layer: "accent",
        // One motion for all three, or the bar comes apart while it breathes.
        motion: barMotion,
        pose: staggered(barPose, i / 4),
        enter: enter(ctx, "pop", 1000 + i * 120, 1000 + i * 120),
      }),
    );
    x += len + 6 * unit;
  });

  const dots = Math.floor(ctx.between(1, 2.99));
  for (let i = 0; i < dots; i++) marks.push(dot(ctx));
  for (const mark of marks) {
    if (mark.layer === "accent" && mark.kind === "path" && !mark.filled)
      ctx.keys.push([{ mark, act: "spin", rot: 90 }]);
  }
  pressKeys(
    ctx,
    marks.filter((m) => m.layer === "structure"),
  );
  // The brand bar presses as one, segment by segment.
  ctx.keys.push(
    marks
      .filter((m) => m.layer === "accent" && m.kind === "path" && m.filled)
      .map((mark, i) => ({ mark, act: "press" as const, delay: i * 70 })),
  );
  return marks;
}
