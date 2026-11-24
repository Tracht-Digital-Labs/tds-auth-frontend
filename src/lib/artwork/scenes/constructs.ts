import type { Ctx } from "../context";
import { pressKeys } from "../context";
import { TILE_FORMS, bigCapsule, diagonal, dot, field, ring, slab, tile } from "../marks";
import type { Mark, Pt } from "../model";
import { bob, shadeOf } from "../motion";
import { shuffle } from "../random";

export function constructScene(ctx: Ctx): Mark[] {
  const marks: Mark[] = [field(ctx)];
  const slabs = Math.floor(ctx.between(1, 2.99));
  for (let i = 0; i < slabs; i++) marks.push(slab(ctx));
  if (ctx.rng() < 0.4) marks.push(bigCapsule(ctx));

  // Tiles on a loose grid of cells, one per cell, so two never stack into a
  // shape nobody designed.
  const cells = shuffle(
    Array.from({ length: 9 }, (_, i) => [20 + (i % 3) * 30, 20 + Math.floor(i / 3) * 30] as Pt),
    ctx.rng,
  );
  const tiles = Math.floor(ctx.between(3, 5.99));
  const shade = shadeOf(ctx);
  for (let i = 0; i < tiles; i++) {
    const [gx, gy] = cells[i]!;
    const size = ctx.between(9, 16);
    marks.push(
      tile(ctx, gx + ctx.between(-6, 6), gy + ctx.between(-6, 6), size, ctx.pick(TILE_FORMS), bob, shade, [
        150 + i * 110,
        300 + i * 110,
      ]),
    );
  }
  if (ctx.rng() < 0.5) marks.push(diagonal(ctx));
  const rings = Math.floor(ctx.between(0, 1.99));
  for (let i = 0; i < rings; i++) marks.push(ring(ctx));
  const dots = Math.floor(ctx.between(2, 4.99));
  for (let i = 0; i < dots; i++) marks.push(dot(ctx));
  pressKeys(ctx, marks);
  for (const mark of marks) {
    if (mark.motion.kind === "orbit")
      ctx.keys.push([{ mark, act: "flick", rot: Math.sign(mark.motion.rot) * 24 }]);
  }
  return marks;
}
