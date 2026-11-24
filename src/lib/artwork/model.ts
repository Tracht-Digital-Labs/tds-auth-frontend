/** The artwork's data model and the bands every composition stays inside. */

/** Square canvas; the SVG slices it to whatever the panel's aspect ratio is. */
export const VIEWBOX = 100;

/**
 * How far a SPANNING mark runs past the canvas at both ends.
 *
 * A strip, band or line that ends inside the frame shows its round cap, which
 * reads as a rendering fault rather than as a design choice — so both ends have
 * to stay outside the crop no matter what happens to them afterwards: the
 * composition is tilted by up to 18°, swayed by another 3°, and each mark moves
 * on top of that. A rotation about the canvas centre swings the ENDS furthest,
 * and swings the ends of a high or low mark *inward*. This is sized for the
 * worst combination, with margin — which is also why a spanning mark never
 * rotates on its own (its motion is a translation, its hover pose carries no
 * rotation; both are pinned in `artwork.test.ts`).
 */
export const OVERHANG = 45;

/**
 * Brand hues the composition may draw from. Resolved under the dark theme (see
 * the module note), so these are the light-on-dark twins.
 *
 * Gold is not drawn as a field hue: it is the brand's punctuation colour ("short
 * rules, single nodes"), so every composition carries it as {@link SPOT} for
 * its nodes, ticks and the brand accent, and nowhere else.
 */
export const PALETTE = [
  "var(--color-primary)",
  "var(--color-accent)",
  "var(--color-accent-pink)",
  "var(--color-cat-violet)",
  "var(--color-cat-cyan)",
  "var(--color-gold)",
] as const;
export const SPOT = "var(--color-gold)";
export const FIELD_HUES = PALETTE.filter((hue) => hue !== SPOT);
export const BRAND_ACCENT = "var(--color-accent)";
export const BRAND_CORAL = "var(--color-accent-pink)";

/**
 * The eight composition archetypes. Each fills the same three layers (see
 * {@link LAYERS}); what differs is the shape and motion vocabulary:
 *
 *  - `constructs` — big cut slabs behind a handful of shadowed tiles.
 *  - `circuits`   — conduits running in from the edge to chips and nodes, with
 *                   signals travelling along them.
 *  - `orbits`     — arc segments turning on one or two foci, nodes riding them.
 *  - `strata`     — parallel capsule bands sliding along their own axis.
 *  - `raster`     — a dot matrix with a pulse running through it as a wave.
 *  - `mosaic`     — a cluster of shadowed tiles that turn by quarter steps.
 *  - `ribbons`    — flat curved paper strips, each with its hard shadow.
 *  - `measure`    — tape-measure rules, registration crosses, the logomark's
 *                   diagonal cut and the brand accent. "Maßarbeit", literally.
 */
export const SCENES = [
  "constructs",
  "circuits",
  "orbits",
  "strata",
  "raster",
  "mosaic",
  "ribbons",
  "measure",
] as const;
export type SceneKind = (typeof SCENES)[number];

/**
 * Depth layers, ordered back to front — and this is also the PAINT order, which
 * is why `Artwork.marks` arrives pre-sorted by it.
 *
 *  - `wash`      soft fields and big translucent slabs. Broad, quiet.
 *  - `structure` the crisp geometry: tiles, conduits, strips, rules, rings.
 *  - `accent`    the few sharp focal points that give the eye somewhere to land.
 */
export const LAYERS = ["wash", "structure", "accent"] as const;
export type Layer = (typeof LAYERS)[number];

/**
 * How far a mark travels, in SVG user units, when the pointer is over the panel.
 *
 * The three bands are DISJOINT, and that separation IS the depth cue: the wash
 * moves least, the accents most. `structure` additionally travels in the
 * OPPOSITE direction (the sign is applied in {@link poseFor}), for the same
 * reason the rings counter-rotate: if every layer slid the same way the response
 * would read as the whole picture being dragged.
 */
export const POSE_BANDS: Record<Layer, readonly [number, number]> = {
  wash: [2.2, 4],
  structure: [4.8, 6.6],
  accent: [7.4, 9.6],
};

/**
 * Ceiling on a mark's hover stagger, in milliseconds. Low, because the same
 * delay applies on the way BACK, and a decoration still rearranging itself half
 * a second after the pointer left reads as lag rather than as weight.
 */
export const POSE_DELAY_MAX = 220;

/**
 * Ceiling on a mark's entrance delay, in milliseconds. The build-up is a
 * one-shot that has to be over before anyone has finished typing an address.
 */
export const ENTER_MAX = 1500;

/** A ceiling on the composition's size: "abstract" must not become "a hundred shapes". */
export const MARKS_MAX = 64;

/**
 * Hard-shadow offset band, in user units. At the desktop panel's ~9 px per unit
 * that is the 6–8 px of `--tds-shadow-hard` on the cards beside it; on the phone
 * band it shrinks with the picture, which is what a drawn shadow should do.
 */
export const SHADE_RANGE = [0.55, 0.95] as const;

/** Ambient drift for one mark. Plain numbers; the component adds the units. */
export interface Drift {
  kind: "drift";
  /** Peak offset in SVG user units, signed. */
  dx: number;
  dy: number;
  /** Peak rotation in degrees, signed. */
  rot: number;
  /** Peak scale, always >= 1: outward only, so an overhang is never pulled in. */
  scale: number;
  /** Seconds for one there-and-back cycle. */
  dur: number;
  /** NEGATIVE seconds: every shape starts mid-cycle, never in unison. */
  delay: number;
}

/**
 * A short arc about the CANVAS centre. Rotating a circle about its own centre
 * is a no-op, so a ring travels by being swung about the canvas instead.
 */
export interface Orbit {
  kind: "orbit";
  rot: number;
  dur: number;
  delay: number;
}

/**
 * A short arc about the mark's OWN pivot — an arc segment turning on the circle
 * it was cut from, and a node riding that circle. The pivot is carried
 * explicitly because `transform-box: fill-box` would turn the arc about its
 * bounding box instead.
 */
export interface Spin {
  kind: "spin";
  rot: number;
  ox: number;
  oy: number;
  dur: number;
  delay: number;
}

/**
 * A quarter step about the tile's own centre, held still for most of the cycle:
 * rest → turn → rest → turn back. The mosaic reads as a still floor that every
 * so often rearranges one tile, not as spinning parts.
 */
export interface Turn {
  kind: "turn";
  /** ±90, or a multiple of it — the tile has to land on its own grid. */
  rot: number;
  ox: number;
  oy: number;
  dur: number;
  delay: number;
}

/** Breathing in opacity only — a multiplier resting at 1. */
export interface Pulse {
  kind: "pulse";
  /** Multiplier on the resting opacity at the bottom of the cycle. */
  dim: number;
  dur: number;
  delay: number;
}

/** A there-and-back translation along a fixed axis. */
export interface Slide {
  kind: "slide";
  dx: number;
  dy: number;
  dur: number;
  delay: number;
}

export type Motion = Drift | Orbit | Spin | Turn | Pulse | Slide;

/**
 * Where a mark goes while the pointer is anywhere over the panel. The PRESENCE
 * of a pointer, never its coordinates: a seeded property of the composition.
 */
export interface Pose {
  /** Travel in SVG user units, signed. */
  dx: number;
  dy: number;
  /** Degrees about the canvas centre. 0 on a wash or spanning mark. */
  rot: number;
  /** Always >= 1: outward only. */
  scale: number;
  /** Milliseconds of stagger, so the composition arrives in waves. */
  delay: number;
}

/**
 * The one-shot build-up when the composition first appears.
 *
 *  - `draw` — an open stroke is drawn along its length (a conduit, an arc).
 *  - `pop`  — a shape grows into place from its own centre.
 *  - `fade` — a spanning shape fades in. It cannot pop: shrunk about its own
 *             centre, a band longer than the canvas would show its caps.
 *  - `none` — the wash, which arrives with the canvas fade.
 */
export interface Enter {
  kind: "none" | "pop" | "draw" | "fade";
  /** Milliseconds. */
  delay: number;
}

/** A pulse of light travelling along a conduit, now and then. */
export interface Signal {
  hue: string;
  dur: number;
  /** NEGATIVE seconds, like every other phase. */
  delay: number;
}

/**
 * One drawn thing.
 *
 * Two render kinds cover every scene — a `path` (stroked or filled) and a
 * `circle` (stroked ring or filled dot) — so `LoginArtwork.tsx` stays a single
 * loop with no per-scene branching.
 */
export interface Mark {
  kind: "path" | "circle";
  /** `kind === "path"`. */
  d?: string;
  /** `kind === "circle"`. */
  cx?: number;
  cy?: number;
  r?: number;
  /** A filled shape rather than a stroked outline. */
  filled: boolean;
  /**
   * The mark must leave the frame at BOTH ends ({@link OVERHANG}); `ends` then
   * names the two ends of its axis. Spanning marks never rotate.
   */
  spans: boolean;
  ends?: [Pt, Pt];
  /** Where the mark sits — its centre, or the corner a cut slab is anchored on. */
  at: Pt;
  hue: string;
  /** Stroke width; 0 on a filled mark. */
  width: number;
  opacity: number;
  /** Index into {@link BLUR_LEVELS}, or -1 for a crisp mark. */
  blur: number;
  /** Hard-shadow offset in user units, down and right; 0 for none. */
  shade: number;
  /** `pathLength="1"` on the node: needed for a drawn entrance or a signal. */
  measured: boolean;
  layer: Layer;
  motion: Motion;
  pose: Pose;
  enter: Enter;
  signal?: Signal;
}

/**
 * What a keystroke does to one mark. Each scene answers typing in its own
 * vocabulary instead of one generic burst:
 *
 *  - `press`   — a shadowed shape sinks into its shadow and springs back (a key).
 *  - `signal`  — a pulse runs along a conduit, edge to node, in one go.
 *  - `light`   — a dot flares and settles (raster cells, terminal nodes).
 *  - `flick`   — an arc or ring swings `rot` degrees about its pivot and back.
 *  - `whirl`   — an orbit's rider runs once round its whole orbit.
 *  - `flip`    — a mosaic tile spins a full turn about its own centre.
 *  - `shove`   — a band is pushed `dx`/`dy` along its axis and returns.
 *  - `flutter` — a paper strip lifts and settles across its run.
 *  - `advance` — a tape pays out one major unit (`dx`/`dy`); the jump back at
 *                the end is a whole tick period, so it is invisible.
 *  - `spin`    — a registration cross turns a quarter (it looks the same after).
 *
 * Every end state is the resting state, so a burst never leaves anything behind.
 */
export const ACTS = [
  "press",
  "signal",
  "light",
  "flick",
  "whirl",
  "flip",
  "shove",
  "flutter",
  "advance",
  "spin",
] as const;
export type Act = (typeof ACTS)[number];

export interface KeyPart {
  /** Index into `Artwork.marks`. */
  mark: number;
  act: Act;
  /** User units, for `shove`, `flutter` and `advance`. */
  dx: number;
  dy: number;
  /** Degrees, for `flick`, `flip` and `spin`. */
  rot: number;
  /** Milliseconds after the keystroke — a signal's node flares on arrival. */
  delay: number;
}

/** One keystroke's answer; the component fires the pool round-robin. */
export interface Keystroke {
  parts: KeyPart[];
}

export interface Artwork {
  seed: number;
  scene: SceneKind;
  /** Whole-composition rotation in degrees, for variety without new shapes. */
  tilt: number;
  /** Whole-composition sway: peak degrees (signed) and the round-trip period. */
  sway: { deg: number; dur: number };
  /** Pre-sorted into paint order: wash → structure → accent. */
  marks: Mark[];
  /** The keystroke pool, fired round-robin. Never empty. */
  keys: Keystroke[];
}

export type Pt = [number, number];

/**
 * Gaussian blur radii the soft fields are bucketed into. Only the far wash is
 * soft; everything constructed is crisp. The largest value sizes the filter
 * region in `LoginArtwork.tsx`; keep it ≤ 20.
 */
export const BLUR_LEVELS = [5, 10, 17] as const;

/**
 * Ceiling on any wash mark's alpha. These are light hues over a dark field with
 * plain alpha compositing: above this a field stops being a tint and becomes a
 * second colour block competing with the form.
 */
export const WASH_ALPHA_MAX = 0.34;

/**
 * How far a mark's anchor may sit outside the canvas. A cut slab is anchored on
 * a corner just outside the frame; anything further is a shape nobody sees.
 */
export const STRAY_MAX = 22;

/** Ceilings on a keystroke's travel, so a burst stays a twitch, not a shove off-canvas. */
export const KEY_TRAVEL_MAX = 18;
export const KEY_DELAY_MAX = 700;
