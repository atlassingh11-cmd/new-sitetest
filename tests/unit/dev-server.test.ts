import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type PackageManifest = {
  scripts?: Record<string, string>;
};

describe("development preview", () => {
  it("uses restart-safe webpack stylesheet URLs", () => {
    const manifest = JSON.parse(
      readFileSync("package.json", "utf8"),
    ) as PackageManifest;

    expect(manifest.scripts?.dev).toBe("next dev --webpack");
  });
});
