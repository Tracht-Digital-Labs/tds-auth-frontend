import type { Ctx } from "../context";
import { staggered } from "../geometry";
import type { TileForm } from "../marks";
import { TILE_FORMS, dot, field, slab, tile } from "../marks";
import type { Mark, Turn } from "../model";
import { poseFor, shadeOf, turn } from "../motion";
import { shuffle } from "../random";

export function mosaicScene(ctx: Ctx): Mark[] {
  const marks: Mark[] = [field(ctx), slab(ctx)];

  const cols = Math.floor(ctx.between(3, 4.99));
  const rows = Math.floor(ctx.between(2, 4.99));
  const size = ctx.between(10, 14);
  const gap = ctx.between(1.2, 2.2);
  const pitch = size + gap;
  const w = cols * pitch - gap;
  const h = rows * pitch - gap;
  const x0 = ctx.between(10, 90 - w);
  const y0 = ctx.between(10, 90 - h);
  const shade = shadeOf(ctx);
  // A floor, not confetti: one tile form dominates and the rest vary around it.
  const main = ctx.pick(["quarter", "half", "quarter", "rect"] as const);
  // The floor lifts as one, in a wave from its first tile to its last.
  const floorPose = poseFor(ctx, "structure");

  let placed = 0;
  const total = cols * rows;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const index = j * cols + i;
      // Leave a few cells open for an irregular silhouette — but never so many
      // that fewer than six tiles remain.
      const open = ctx.rng() < 0.22 && total - index > 6 - placed;
      if (open) continue;
      const cx = x0 + i * pitch + size / 2;
      const cy = y0 + j * pitch + size / 2;
      const form: TileForm = ctx.rng() < 0.65 ? main : ctx.pick(TILE_FORMS.filter((f) => f !== "capsule"));
      marks.push(
        tile(
          ctx,
          cx,
          cy,
          size,
          form,
          (c) => turn(c, cx, cy),
          shade,
          [100 + index * 60, 160 + index * 60],
          staggered(floorPose, index / total),
        ),
      );
      placed++;
    }
  }

  const dots = Math.floor(ctx.between(2, 4.99));
  for (let i = 0; i < dots; i++) marks.push(dot(ctx));
  // In a shuffled order, so typing does not walk the floor row by row.
  for (const mark of shuffle(
    marks.filter((m) => m.motion.kind === "turn"),
    ctx.rng,
  )) {
    ctx.keys.push([{ mark, act: "flip", rot: Math.sign((mark.motion as Turn).rot) * 360 }]);
  }
  return marks;
}
