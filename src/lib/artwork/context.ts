import type { Act, Mark } from "./model";

/**
 * The draw context handed to every scene builder.
 *
 * NOTE ON ORDERING: every draw happens in source order, object-literal property
 * values included. Moving a line silently reshuffles EVERY composition, because
 * each mark's values come off one shared stream. Never a cosmetic edit.
 */
export interface Ctx {
  rng: () => number;
  between: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  /** ±magnitude. Consumes one draw. */
  signed: (value: number) => number;
  /** A negative start offset inside the first cycle. One draw. */
  phase: (duration: number) => number;
  hues: string[];
  /** Unit vector the whole composition displaces along under hover. */
  ux: number;
  uy: number;
  /** Running count of turning marks, so consecutive ones alternate direction. */
  turns: number;
  /** Keystroke answers, collected by the builders against mark OBJECTS. */
  keys: Draft[][];
}

/** A key part before paint order is known; resolved to an index afterwards. */
export interface Draft {
  mark: Mark;
  act: Act;
  dx?: number;
  dy?: number;
  rot?: number;
  delay?: number;
}

/** Every shadowed shape becomes a key of its own: it sinks into its shadow. */
export function pressKeys(ctx: Ctx, marks: Mark[]): void {
  for (const mark of marks) if (mark.shade > 0) ctx.keys.push([{ mark, act: "press" }]);
}
