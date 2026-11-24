import type { Ctx, Draft } from "../context";
import { conduitPath, place, roundRectPath } from "../geometry";
import { dot, field, slab } from "../marks";
import type { Mark, Pt } from "../model";
import { OVERHANG, SPOT } from "../model";
import { base, enter, poseFor, shadeOf, slide } from "../motion";
import { clamp, r, r3 } from "../numbers";

/** How long a keystroke's pulse takes to reach the end of its conduit. */
export const ARRIVAL_MS = 520;

export function circuitScene(ctx: Ctx): Mark[] {
  const marks: Mark[] = [field(ctx), slab(ctx)];

  // The board moves as ONE piece: conduits, chips and nodes share a single
  // slide (same values, same phase), or the connections would come apart.
  const board = slide(ctx, ctx.ux, ctx.uy, 1.5, 3.5);
  const still = () => board;
  // ...and answers hover as one piece, too.
  const boardPose = poseFor(ctx, "structure");

  const chips: Pt[] = [];
  // Drawn now (their positions route the conduits) but painted LAST: a conduit
  // runs into a chip, so it has to disappear under it, not cross over it.
  const chipMarks: Mark[] = [];
  const chipCount = Math.floor(ctx.between(1, 2.99));
  const shade = shadeOf(ctx);
  for (let i = 0; i < chipCount; i++) {
    const c: Pt = [ctx.between(30, 72), i === 0 ? ctx.between(26, 46) : ctx.between(56, 76)];
    chips.push(c);
    const w = ctx.between(12, 18);
    const h = ctx.between(8, 12);
    chipMarks.push(
      base({
        kind: "path",
        d: roundRectPath(place(c[0], c[1]), w, h, 2.2),
        filled: true,
        at: [r(c[0]), r(c[1])],
        hue: ctx.pick(ctx.hues),
        opacity: r3(ctx.between(0.84, 0.95)),
        shade,
        layer: "structure",
        motion: still(),
        pose: boardPose,
        enter: enter(ctx, "pop", 900, 1300),
      }),
    );
  }

  const nodes: Mark[] = [];
  const runs = Math.floor(ctx.between(3, 5.99));
  for (let i = 0; i < runs; i++) {
    // From one of the four edges, at a right-angle rotation of a left-to-right
    // run — a 90° rotation keeps every segment axis-aligned.
    const side = Math.floor(ctx.rng() * 4);
    const toChip = i < chips.length * 2 && ctx.rng() < 0.7;
    const target: Pt = toChip ? chips[i % chips.length]! : [ctx.between(25, 80), ctx.between(20, 80)];
    const fwd = place(50, 50, side * 90);
    const back = place(50, 50, -side * 90);
    const local = back([target[0] - 50, target[1] - 50]);
    const [tx, ty] = local;
    const y0 = clamp(ty + ctx.signed(ctx.between(8, 26)), 10, 90);
    const x1 = ctx.between(Math.max(4, tx - 40), tx - 8);
    const pts: Pt[] = [
      [-OVERHANG, y0],
      [x1, y0],
      [x1, ty],
      [tx, ty],
    ].map(([x, y]) => fwd([x - 50, y - 50]));
    const end = pts[pts.length - 1]!;
    const hue = ctx.pick(ctx.hues);
    const delay = 80 + i * 160;
    const conduit = base({
      kind: "path",
      d: conduitPath(pts, ctx.between(2.5, 4.5)),
      at: [r(end[0]), r(end[1])],
      hue,
      width: r3(ctx.between(0.45, 0.75)),
      opacity: r3(ctx.between(0.45, 0.72)),
      measured: true,
      layer: "structure",
      motion: still(),
      pose: boardPose,
      enter: enter(ctx, "draw", delay, delay + 60),
      signal: (() => {
        const dur = r(ctx.between(3.5, 7));
        return { hue: ctx.rng() < 0.6 ? SPOT : hue, dur, delay: ctx.phase(dur) };
      })(),
    });
    marks.push(conduit);
    // A keystroke sends a pulse down this conduit; what it runs into answers
    // when the pulse arrives — a chip presses like a key, a node flares.
    const key: Draft[] = [{ mark: conduit, act: "signal" }];
    if (toChip) key.push({ mark: chipMarks[i % chips.length]!, act: "press", delay: ARRIVAL_MS });
    ctx.keys.push(key);
    // The terminal node sits ON the board: structure, with the board's pose,
    // or hover would pull it off the end of its own conduit.
    if (!toChip) {
      const node = base({
        kind: "circle",
        cx: r(end[0]),
        cy: r(end[1]),
        r: r(ctx.between(1, 1.6)),
        filled: true,
        at: [r(end[0]), r(end[1])],
        hue: SPOT,
        opacity: r3(ctx.between(0.8, 0.95)),
        layer: "structure",
        motion: still(),
        pose: boardPose,
        enter: enter(ctx, "pop", delay + 700, delay + 800),
      });
      nodes.push(node);
      key.push({ mark: node, act: "light", delay: ARRIVAL_MS });
    }
  }
  marks.push(...nodes, ...chipMarks);
  // A few loose pads on the board.
  const pads = Math.floor(ctx.between(1, 3.99));
  for (let i = 0; i < pads; i++) marks.push(dot(ctx, undefined, undefined, ctx.between(0.6, 1.1)));
  return marks;
}
