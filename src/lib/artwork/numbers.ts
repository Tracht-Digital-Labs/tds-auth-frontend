/** Rounding and clamping for values that end up in the markup. */

export function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/** Round to 2dp — the markup is ~40% smaller and nothing is visibly different. */
export function r(value: number): number {
  return Math.round(value * 100) / 100;
}

/** 3dp, for the few values where 2dp would quantise a narrow band flat. */
export function r3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
