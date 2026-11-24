/**
 * The generative artwork beside the login form.
 *
 * A fresh composition on every visit — but a *bounded* one. That is the whole
 * design constraint: anything random enough to be interesting is also random
 * enough to produce something ugly, so the ranges here are deliberately narrow.
 * Counts, sizes, alphas and palette are all clamped to a band that cannot
 * compose badly; what varies is the arrangement inside it.
 *
 * The vocabulary is the brand's "Digitale Maßarbeit" (tds-shared's decoration
 * layer): CONSTRUCTED geometry — capsules, quarter and half circles, strongly
 * rounded rectangles — cut by the frame, conduit lines with rounded 90° corners
 * and nodes, the three-part brand accent, and the hard, unblurred 2D offset
 * shadow every card and button on the public sites and panels carries. It
 * replaced an aurora of blurred ribbons under a `screen` blend, which was the
 * "kalte Tech-Optik" the shared pass removed everywhere else. Only the far wash
 * is still soft, the way `.tds-wash` is soft at a section's edges.
 *
 * Variety comes from a SCENE drawn per visit — eight archetypes with different
 * shape and motion vocabularies (see {@link SCENES}).
 *
 * Pure and seeded, so a composition is reproducible from its number alone —
 * which is what makes it testable at all (see `artwork.test.ts`) and what would
 * let a specific one be pinned later if we ever want a fixed marketing shot.
 *
 * Colours are emitted as `var(--color-*)` references rather than literals. The
 * stage resolves them under `data-theme="dark"` in both page themes, because
 * the panel is a fixed dark field: the light theme's navy marks on a navy
 * ground were invisible.
 */

import type { Ctx } from "./artwork/context";
import type { Artwork, Keystroke, Mark, SceneKind } from "./artwork/model";
import { BRAND_ACCENT, BRAND_CORAL, FIELD_HUES, LAYERS, SCENES } from "./artwork/model";
import { r } from "./artwork/numbers";
import { mulberry32, shuffle } from "./artwork/random";
import { circuitScene } from "./artwork/scenes/circuits";
import { constructScene } from "./artwork/scenes/constructs";
import { measureScene } from "./artwork/scenes/measure";
import { mosaicScene } from "./artwork/scenes/mosaic";
import { orbitScene } from "./artwork/scenes/orbits";
import { rasterScene } from "./artwork/scenes/raster";
import { ribbonScene } from "./artwork/scenes/ribbons";
import { strataScene } from "./artwork/scenes/strata";

export {
  ACTS,
  BLUR_LEVELS,
  ENTER_MAX,
  KEY_DELAY_MAX,
  KEY_TRAVEL_MAX,
  LAYERS,
  MARKS_MAX,
  OVERHANG,
  PALETTE,
  POSE_BANDS,
  POSE_DELAY_MAX,
  SCENES,
  SHADE_RANGE,
  SPOT,
  STRAY_MAX,
  VIEWBOX,
  WASH_ALPHA_MAX,
} from "./artwork/model";
export type {
  Act,
  Artwork,
  Drift,
  Enter,
  KeyPart,
  Keystroke,
  Layer,
  Mark,
  Motion,
  Orbit,
  Pose,
  Pt,
  Pulse,
  SceneKind,
  Signal,
  Slide,
  Spin,
  Turn,
} from "./artwork/model";
export { randomSeed } from "./artwork/random";
export { ARRIVAL_MS } from "./artwork/scenes/circuits";

/** How far each scene may tilt. The orthogonal ones read as askew past ~10°. */
const TILT_MAX: Record<SceneKind, number> = {
  constructs: 18,
  circuits: 10,
  orbits: 18,
  strata: 18,
  raster: 10,
  mosaic: 10,
  ribbons: 18,
  measure: 12,
};

/**
 * Build one composition.
 *
 * `scene` is for tests and for a future pinned shot; the draw for it is
 * consumed either way, so `generateArtwork(s)` and `generateArtwork(s, <the
 * scene s would have picked>)` are the same composition.
 */
export function generateArtwork(seed: number, scene?: SceneKind): Artwork {
  const rng = mulberry32(seed);
  const between = (min: number, max: number) => min + rng() * (max - min);
  const pick = <T>(items: readonly T[]): T => items[Math.floor(rng() * items.length)]!;
  const signed = (value: number) => (rng() < 0.5 ? -value : value);
  // Capped at 0.95 of the period: a delay of exactly `-dur` is the unison this
  // exists to prevent, and 2dp rounding can otherwise land there.
  const phase = (duration: number) => r(-duration * rng() * 0.95);

  const drawn = SCENES[Math.floor(rng() * SCENES.length)]!;
  const kind = scene ?? drawn;

  // Two or three field hues, never all of them: a full palette in one frame
  // reads as a colour test card. Gold rides along as the spot colour.
  let hues: string[] = shuffle(FIELD_HUES, rng).slice(0, rng() < 0.5 ? 2 : 3);
  // The brand accent is bordeaux · coral · gold and nothing else, so a scene
  // that sets it builds its palette around those two hues instead of adding
  // them on top — which would be five colours in one frame.
  if (kind === "measure") {
    hues = [BRAND_ACCENT, BRAND_CORAL, ...hues.filter((h) => h !== BRAND_ACCENT && h !== BRAND_CORAL)].slice(
      0,
      3,
    );
  }

  // One direction for the whole composition. Per-mark directions would cancel
  // out into a shimmer; one axis reads as the picture leaning.
  const angle = rng() * Math.PI * 2;
  const ctx: Ctx = {
    rng,
    between,
    pick,
    signed,
    phase,
    hues,
    ux: Math.cos(angle),
    uy: Math.sin(angle),
    turns: 0,
    keys: [],
  };

  const build: Record<SceneKind, (c: Ctx) => Mark[]> = {
    constructs: constructScene,
    circuits: circuitScene,
    orbits: orbitScene,
    strata: strataScene,
    raster: rasterScene,
    mosaic: mosaicScene,
    ribbons: ribbonScene,
    measure: measureScene,
  };
  const marks = sortByLayer(build[kind](ctx));
  const keys: Keystroke[] = ctx.keys
    .filter((parts) => parts.length > 0)
    .map((parts) => ({
      parts: parts.map((p) => ({
        mark: marks.indexOf(p.mark),
        act: p.act,
        dx: r(p.dx ?? 0),
        dy: r(p.dy ?? 0),
        rot: r(p.rot ?? 0),
        delay: Math.round(p.delay ?? 0),
      })),
    }));

  const tiltMax = TILT_MAX[kind];
  return {
    seed,
    scene: kind,
    tilt: r(between(-tiltMax, tiltMax)),
    sway: { deg: signed(between(1.5, 3)), dur: r(between(70, 100)) },
    marks,
    keys,
  };
}

/** Stable sort into paint order — builders may emit an accent before structure. */
function sortByLayer(marks: Mark[]): Mark[] {
  return marks
    .map((mark, i) => ({ mark, i }))
    .sort((a, b) => LAYERS.indexOf(a.mark.layer) - LAYERS.indexOf(b.mark.layer) || a.i - b.i)
    .map(({ mark }) => mark);
}
