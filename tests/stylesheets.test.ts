import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * `global.css` ships only the partials it imports. A partial under
 * `src/styles/global/` that it leaves out would drop its rules from the site
 * without a build error.
 */
const STYLES = new URL("../src/styles/", import.meta.url);
const IMPORT = /^@import "\.\/global\/([\w-]+\.css)";$/gm;

describe("global.css", () => {
  const index = readFileSync(new URL("global.css", STYLES), "utf8").replace(/\r\n/g, "\n");

  it("imports every partial under global/ exactly once", () => {
    const imported = [...index.matchAll(IMPORT)].map(([, file]) => file!);
    expect([...imported].sort()).toEqual(readdirSync(new URL("global/", STYLES)).sort());
    expect(new Set(imported).size).toBe(imported.length);
  });

  it("holds no rules of its own: comments, imports and Tailwind's @source only", () => {
    const rest = index
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^@(import|source) "[^"]+";$/gm, "");
    expect(rest.trim()).toBe("");
  });
});
