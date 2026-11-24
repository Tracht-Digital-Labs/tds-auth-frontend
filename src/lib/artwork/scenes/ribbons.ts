import type { Ctx } from "../context";
import { dot, field, ring } from "../marks";
import type { Mark, Pt } from "../model";
import { OVERHANG, VIEWBOX } from "../model";
import { base, enter, poseFor, shadeOf, slide } from "../motion";
import { r, r3 } from "../numbers";

export function ribbonScene(ctx: Ctx): Mark[] {
  const marks: Mark[] = [field(ctx)];
  if (ctx.rng() < 0.5) marks.push(field(ctx));

  // Flat paper strips: a curved band entering left and leaving right, solid,
  // each lying on its own hard shadow.
  const strips = Math.floor(ctx.between(3, 5.99));
  const shade = shadeOf(ctx);
  for (let i = 0; i < strips; i++) {
    const y0 = ctx.between(10, 90);
    const y1 = ctx.between(10, 90);
    const c1y = y0 + ctx.between(-40, 40);
    const c2y = y1 + ctx.between(-40, 40);
    const a: Pt = [-OVERHANG, r(y0)];
    const b: Pt = [VIEWBOX + OVERHANG, r(y1)];
    marks.push(
      base({
        kind: "path",
        d: `M ${a[0]} ${a[1]} C ${r(ctx.between(15, 45))} ${r(c1y)}, ${r(ctx.between(55, 85))} ${r(c2y)}, ${b[0]} ${b[1]}`,
        spans: true,
        ends: [a, b],
        at: [50, r((y0 + y1) / 2)],
        hue: ctx.pick(ctx.hues),
        width: r(ctx.between(3, 8)),
        opacity: r3(ctx.between(0.8, 0.95)),
        shade,
        measured: true,
        layer: "structure",
        motion: slide(ctx, 0.2, 1, 3, 7),
        pose: poseFor(ctx, "structure", true),
        enter: enter(ctx, "draw", i * 180, i * 180 + 100),
      }),
    );
  }
  const rings = Math.floor(ctx.between(1, 2.99));
  for (let i = 0; i < rings; i++) marks.push(ring(ctx));
  const dots = Math.floor(ctx.between(2, 4.99));
  for (let i = 0; i < dots; i++) marks.push(dot(ctx));
  let lift = 1;
  for (const mark of marks) {
    if (!mark.spans) continue;
    ctx.keys.push([{ mark, act: "flutter", dy: lift * 3.2 }]);
    lift = -lift;
  }
  return marks;
}
