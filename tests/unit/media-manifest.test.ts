import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { mediaManifest } from "@/content/media";

describe("media shipping allowlist", () => {
  it("contains unique local paths that resolve in public/media", () => {
    const paths = mediaManifest.map((asset) => asset.publicPath);
    expect(new Set(paths).size).toBe(paths.length);

    for (const asset of mediaManifest) {
      expect(asset.publicPath).toMatch(/^\/media\//);
      const exportedFile = join(process.cwd(), "public", asset.publicPath);
      expect(existsSync(exportedFile), asset.publicPath).toBe(true);
      expect(statSync(exportedFile).size).toBe(asset.bytes);
    }
  });

  it("contains every shipped media file and no unreviewed extras", () => {
    const mediaRoot = join(process.cwd(), "public", "media");
    const shippedPaths = readdirSync(mediaRoot, {
      recursive: true,
      withFileTypes: true,
    })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const parent = entry.parentPath.slice(mediaRoot.length).replaceAll("\\", "/");
        return `/media${parent}/${entry.name}`.replaceAll("//", "/");
      })
      .sort();
    const reviewedPaths = mediaManifest.map((asset) => asset.publicPath).sort();

    expect(shippedPaths).toEqual(reviewedPaths);
  });

  it("records stable dimensions for visual media", () => {
    for (const asset of mediaManifest.filter(
      (candidate) => candidate.kind === "image" || candidate.kind === "video",
    )) {
      expect(asset.width, asset.publicPath).toBeGreaterThan(0);
      expect(asset.height, asset.publicPath).toBeGreaterThan(0);
    }
  });

  it("allows the advisor film once and only after explicit play", () => {
    const films = mediaManifest.filter((asset) => asset.publicPath === "/media/iffy-film.mp4");
    expect(films).toHaveLength(1);
    expect(films[0].loading).toBe("explicit-play");
    expect(films[0].fallback).toBe("/media/iffy-film-poster.webp");
    expect(mediaManifest.some((asset) => asset.publicPath === "/media/iffy-film.vtt")).toBe(
      true,
    );
  });

  it("records the hero video as a post-LCP enhancement with its own poster", () => {
    const heroVideo = mediaManifest.find(
      (asset) => asset.publicPath === "/media/iffy-hero.mp4",
    );

    expect(heroVideo?.loading).toBe("after-lcp");
    expect(heroVideo?.fallback).toBe("/media/iffy-hero-poster.webp");
  });

  it("excludes stored duplicate formats and deferred Palm sequences", () => {
    const paths = mediaManifest.map((asset) => asset.publicPath);
    expect(paths).not.toContain("/media/hero-downtown.jpg");
    expect(paths).not.toContain("/media/palm-before.webp");
    expect(paths).not.toContain("/media/palm-complete.webp");
    expect(paths).not.toContain("/media/palm-lifestyle.webp");
  });
});
