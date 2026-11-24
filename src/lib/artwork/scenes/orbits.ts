import type { Ctx, Draft } from "../context";
import { arc, dot, field, slab, tile } from "../marks";
import type { Mark, Pt, Spin } from "../model";
import { bob, shadeOf, spin } from "../motion";
import { r } from "../numbers";

export function orbitScene(ctx: Ctx): Mark[] {
  const marks: Mark[] = [field(ctx)];
  if (ctx.rng() < 0.5) marks.push(field(ctx));
  marks.push(slab(ctx));

  // One or two foci. Two reads as a binary system; one as a single orrery.
  const foci: Pt[] = [[ctx.between(34, 66), ctx.between(34, 66)]];
  if (ctx.rng() < 0.5) foci.push([ctx.between(30, 70), ctx.between(30, 70)]);

  // A solid core on each focus, shadowed like a tile: the orrery's sun.
  const shade = shadeOf(ctx);
  for (const [fx, fy] of foci) {
    marks.push(tile(ctx, fx, fy, ctx.between(6, 10), "disc", bob, shade, [100, 300]));
  }

  const arcs = Math.floor(ctx.between(5, 9.99));
  const radii: number[] = [];
  for (let i = 0; i < arcs; i++) {
    const [fx, fy] = foci[i % foci.length]!;
    const radius = ctx.between(10, 34);
    radii.push(radius);
    marks.push(arc(ctx, fx, fy, radius));
  }

  // Nodes riding the orbits: on an arc's circle, turning about the same focus.
  const riders = Math.floor(ctx.between(2, 3.99));
  for (let i = 0; i < riders; i++) {
    const k = i % arcs;
    const [fx, fy] = foci[k % foci.length]!;
    const a = ctx.rng() * Math.PI * 2;
    marks.push(
      dot(
        ctx,
        fx + radii[k]! * Math.cos(a),
        fy + radii[k]! * Math.sin(a),
        ctx.between(0.9, 1.5),
        (c) => spin(c, fx, fy, 8, 20),
        true,
      ),
    );
  }
  const dots = Math.floor(ctx.between(1, 3.99));
  for (let i = 0; i < dots; i++) marks.push(dot(ctx));
  for (const [fx, fy] of foci) {
    const onFocus = (m: Mark) => m.motion.kind === "spin" && m.motion.ox === r(fx) && m.motion.oy === r(fy);
    const core = marks.find((m) => m.shade > 0 && m.at[0] === r(fx) && m.at[1] === r(fy));
    const swing: Draft[] = marks
      .filter((m) => onFocus(m) && m.layer === "structure")
      .map((m) => ({ mark: m, act: "flick" as const, rot: Math.sign((m.motion as Spin).rot) * 28 }));
    if (core) swing.unshift({ mark: core, act: "press" });
    ctx.keys.push(swing);
    ctx.keys.push(
      marks
        .filter((m) => onFocus(m) && m.layer === "accent")
        .map((m) => ({ mark: m, act: "whirl" as const, rot: Math.sign((m.motion as Spin).rot) * 360 })),
    );
  }
  return marks;
}
