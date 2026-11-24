import type { Ctx, Draft } from "../context";
import { staggered } from "../geometry";
import { TILE_FORMS, bigCapsule, dot, field, ring, slab, tile } from "../marks";
import type { Mark, Pulse } from "../model";
import { base, bob, enter, poseFor, shadeOf } from "../motion";
import { r, r3 } from "../numbers";
import { shuffle } from "../random";

export function rasterScene(ctx: Ctx): Mark[] {
  const marks: Mark[] = [field(ctx), slab(ctx)];
  if (ctx.rng() < 0.5) marks.push(bigCapsule(ctx));

  // The matrix: a block of dots, off-centre, with a pulse running through it
  // as a wave. Every dot shares ONE period and takes its phase from where it
  // sits along the wave's direction — seeded, positional, never random.
  const cols = Math.floor(ctx.between(5, 8.99));
  const rows = Math.floor(ctx.between(4, 6.99));
  const gap = ctx.between(6, 8.5);
  const x0 = ctx.between(12, Math.max(12, 88 - (cols - 1) * gap));
  const y0 = ctx.between(12, Math.max(12, 88 - (rows - 1) * gap));
  const waveDur = r(ctx.between(5, 8));
  const wa = ctx.rng() * Math.PI * 2;
  const wx = Math.cos(wa);
  const wy = Math.sin(wa);
  const span = Math.abs(wx) * (cols - 1) * gap + Math.abs(wy) * (rows - 1) * gap || 1;
  const lo = Math.min(0, wx * (cols - 1) * gap) + Math.min(0, wy * (rows - 1) * gap);
  const hue = ctx.pick(ctx.hues);
  const lit = new Set<number>();
  const litCount = Math.floor(ctx.between(2, 4.99));
  for (let i = 0; i < litCount; i++) lit.add(Math.floor(ctx.rng() * cols * rows));

  const grid: Mark[] = [];
  const accents: Mark[] = [];
  const cells: Mark[] = [];
  // One pose for the matrix, delayed along the wave: the block moves as a
  // block, and the movement runs through it the way the pulse does.
  const gridPose = poseFor(ctx, "structure");
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = x0 + i * gap;
      const y = y0 + j * gap;
      const along = (wx * i * gap + wy * j * gap - lo) / span;
      const wave: Pulse = {
        kind: "pulse",
        dim: 0.45,
        dur: waveDur,
        delay: r(-waveDur * 0.9 * along),
      };
      if (lit.has(j * cols + i)) {
        const d = dot(ctx, x, y, ctx.between(1.1, 1.6), () => wave, true, [700, 1100]);
        accents.push(d);
        cells[j * cols + i] = d;
        continue;
      }
      const cell = base({
        kind: "circle",
        cx: r(x),
        cy: r(y),
        r: r(ctx.between(0.45, 0.65)),
        filled: true,
        at: [r(x), r(y)],
        hue,
        opacity: r3(ctx.between(0.5, 0.75)),
        layer: "structure",
        motion: wave,
        pose: staggered(gridPose, along),
        // The block builds up along the wave, too.
        enter: enter(ctx, "pop", 120 + along * 800, 160 + along * 800),
      });
      grid.push(cell);
      cells[j * cols + i] = cell;
    }
  }
  marks.push(...grid);

  const shade = shadeOf(ctx);
  const tiles = Math.floor(ctx.between(1, 2.99));
  for (let i = 0; i < tiles; i++) {
    marks.push(
      tile(
        ctx,
        ctx.between(20, 80),
        ctx.between(20, 80),
        ctx.between(9, 14),
        ctx.pick(TILE_FORMS),
        bob,
        shade,
        [900, 1300],
      ),
    );
  }
  marks.push(ring(ctx));
  marks.push(...accents);
  // Each keystroke lights a cell, and the light steps out to its four
  // neighbours a beat later — a keypad being played, not a drop in water.
  const presses = shuffle(
    Array.from({ length: cols * rows }, (_, k) => k),
    ctx.rng,
  ).slice(0, 10);
  for (const k of presses) {
    const i = k % cols;
    const j = Math.floor(k / cols);
    const key: Draft[] = [{ mark: cells[k]!, act: "light" }];
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const ni = i + di;
      const nj = j + dj;
      if (ni >= 0 && ni < cols && nj >= 0 && nj < rows)
        key.push({ mark: cells[nj * cols + ni]!, act: "light", delay: 90 });
    }
    ctx.keys.push(key);
  }
  return marks;
}
