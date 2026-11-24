import type { Ctx } from "./context";
import type { Drift, Enter, Layer, Mark, Orbit, Pose, Pulse, Slide, Spin, Turn } from "./model";
import { ENTER_MAX, POSE_BANDS, POSE_DELAY_MAX, SHADE_RANGE } from "./model";
import { r, r3 } from "./numbers";

/* ---------------------------------------------------------------------------
   Motion, pose and entrance builders. Nothing below knows which scene it is
   being built for.
   ------------------------------------------------------------------------ */

/** The hover pose for a mark on `layer`. Sign and rotation come from the layer. */
export function poseFor(ctx: Ctx, layer: Layer, still = false): Pose {
  const [lo, hi] = POSE_BANDS[layer];
  // Structure moves AGAINST the rest — see POSE_BANDS.
  const travel = ctx.between(lo, hi) * (layer === "structure" ? -1 : 1);
  // The draw is consumed either way, so `still` never reshuffles a neighbour.
  const turn = r(ctx.signed(ctx.between(1.2, 4)));
  const rot = layer === "wash" || still ? 0 : turn;
  const scale = r3(1 + ctx.between(0.01, layer === "wash" ? 0.03 : 0.06));
  return {
    dx: r(ctx.ux * travel),
    dy: r(ctx.uy * travel),
    rot,
    scale,
    delay: Math.round(ctx.rng() * POSE_DELAY_MAX),
  };
}

export function enter(ctx: Ctx, kind: Enter["kind"], lo: number, hi: number): Enter {
  return { kind, delay: kind === "none" ? 0 : Math.round(Math.min(ENTER_MAX, ctx.between(lo, hi))) };
}

export function drift(ctx: Ctx, amp = 1): Drift {
  const dur = r(ctx.between(20, 38));
  return {
    kind: "drift",
    dx: r(ctx.signed(ctx.between(8, 14) * amp)),
    dy: r(ctx.signed(ctx.between(6, 11) * amp)),
    rot: r(ctx.signed(ctx.between(1.5, 3.5) * amp)),
    // 3dp: 2dp would quantise this narrow band far too coarsely.
    scale: r3(1 + ctx.between(0.02, 0.06) * amp),
    dur,
    delay: ctx.phase(dur),
  };
}

/** Direction alternates across the WHOLE composition — see `Ctx.turns`. */
export function orbit(ctx: Ctx): Orbit {
  const dur = r(ctx.between(45, 80));
  return {
    kind: "orbit",
    rot: r((ctx.turns++ % 2 === 0 ? 1 : -1) * ctx.between(3, 6)),
    dur,
    delay: ctx.phase(dur),
  };
}

export function spin(ctx: Ctx, ox: number, oy: number, lo = 4, hi = 14): Spin {
  const dur = r(ctx.between(40, 90));
  return {
    kind: "spin",
    rot: r((ctx.turns++ % 2 === 0 ? 1 : -1) * ctx.between(lo, hi)),
    ox: r(ox),
    oy: r(oy),
    dur,
    delay: ctx.phase(dur),
  };
}

export function turn(ctx: Ctx, ox: number, oy: number): Turn {
  const dur = r(ctx.between(14, 30));
  return {
    kind: "turn",
    rot: (ctx.turns++ % 2 === 0 ? 1 : -1) * 90,
    ox: r(ox),
    oy: r(oy),
    dur,
    delay: ctx.phase(dur),
  };
}

export function pulse(ctx: Ctx, lo = 0.5, hi = 0.78): Pulse {
  const dur = r(ctx.between(5, 11));
  return { kind: "pulse", dim: r3(ctx.between(lo, hi)), dur, delay: ctx.phase(dur) };
}

/** Along the axis (`dx`,`dy`, a unit vector); the amplitude is drawn here. */
export function slide(ctx: Ctx, dx: number, dy: number, lo: number, hi: number): Slide {
  const amp = ctx.between(lo, hi);
  const dur = r(ctx.between(25, 50));
  return { kind: "slide", dx: r(dx * amp), dy: r(dy * amp), dur, delay: ctx.phase(dur) };
}

/** A small bob in a random direction — tiles that should feel set down, not fixed. */
export function bob(ctx: Ctx): Slide {
  const a = ctx.rng() * Math.PI * 2;
  return slide(ctx, Math.cos(a), Math.sin(a), 1.5, 4);
}

export function shadeOf(ctx: Ctx): number {
  return r(ctx.between(SHADE_RANGE[0], SHADE_RANGE[1]));
}

/** Fields shared by every mark, so the builders below only state what differs. */
export function base(
  over: Partial<Mark> & Pick<Mark, "kind" | "at" | "hue" | "layer" | "motion" | "pose" | "opacity">,
): Mark {
  return {
    filled: false,
    spans: false,
    width: 0,
    blur: -1,
    shade: 0,
    measured: false,
    enter: { kind: "none", delay: 0 },
    ...over,
  };
}
