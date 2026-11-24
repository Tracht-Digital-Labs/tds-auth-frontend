import { readFileSync } from "node:fs";

const STYLES = new URL("../src/styles/", import.meta.url);

/**
 * For tests: `src/styles/<name>.css` with its own partials (`./<name>/*.css`)
 * inlined where they are imported, so a source-level rule about the sheet
 * holds whichever partial the rule sits in. Package imports (Tailwind,
 * tds-shared) stay as they are.
 */
export function readStylesheet(name: string): string {
  const partial = new RegExp(`^@import "\\./(${name}/[\\w-]+\\.css)";\\r?$`, "gm");
  return readFileSync(new URL(`${name}.css`, STYLES), "utf8").replace(partial, (_, file: string) =>
    readFileSync(new URL(file, STYLES), "utf8"),
  );
}
