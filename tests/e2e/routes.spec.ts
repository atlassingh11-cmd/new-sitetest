import { expect, test } from "@playwright/test";

import legacyRoutes from "../fixtures/legacy-routes.json";

const publicRoutes = legacyRoutes.routes.filter((route) => route.expectedStatus === 200);
const approvedRedesignHeadings: Record<string, string> = {
  "/": "Advice you can hold me to.",
  "/areas": "Dubai and Abu Dhabi area guides",
};

const directContactHrefs = [
  "tel:+971585802689",
  "mailto:iffy@kamaniliving.com",
  "https://maps.app.goo.gl/C8X2wJoAyDFFxAFm6",
  "https://instagram.com/iffy_realestate",
] as const;

function approvedMetadata(route: (typeof publicRoutes)[number]) {
  if (route.path === "/areas") {
    return {
      description: route.description
        .replace("communities — ", "communities, ")
        .replace(" Island — with", " Island, with"),
      ogTitle: route.ogTitle.replace(" — ", " | "),
      ogDescription: route.ogDescription,
    };
  }

  if (route.path.startsWith("/areas/")) {
    return {
      description: route.description,
      ogTitle: route.ogTitle.replace(" — ", ": "),
      ogDescription: route.ogDescription.replace(" — ", ": "),
    };
  }

  return {
    description: route.description,
    ogTitle: route.ogTitle,
    ogDescription: route.ogDescription,
  };
}

function normalizePath(pathname: string) {
  const cleanPath = pathname.replace(/\/+$/, "");
  return cleanPath || "/";
}

async function schemaTypesOnPage(page: import("@playwright/test").Page) {
  return page.locator('script[type="application/ld+json"]').evaluateAll((scripts) => {
    const types = new Set<string>();

    const collectTypes = (value: unknown) => {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        value.forEach(collectTypes);
        return;
      }

      const record = value as Record<string, unknown>;
      if (typeof record["@type"] === "string") types.add(record["@type"]);
      if (Array.isArray(record["@type"])) {
        record["@type"].forEach((type) => {
          if (typeof type === "string") types.add(type);
        });
      }
      if (record["@graph"]) collectTypes(record["@graph"]);
    };

    scripts.forEach((script) => {
      try {
        collectTypes(JSON.parse(script.textContent || "null"));
      } catch {
        // A malformed schema is surfaced by the missing expected type assertion.
      }
    });

    return [...types];
  });
}

for (const route of publicRoutes) {
  test(`${route.path} preserves its public route contract`, async ({ page }) => {
    const response = await page.goto(route.path);
    const metadata = approvedMetadata(route);

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(route.title);
    await expect(page.locator("h1").first()).toContainText(
      approvedRedesignHeadings[route.path] ?? route.primaryHeading,
    );
    await expect(page.locator("h1")).toHaveCount(route.headingCount);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical ? new URL(canonical).href : null).toBe(new URL(route.canonical).href);

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      metadata.description,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      metadata.ogTitle,
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      metadata.ogDescription,
    );
    const ogUrl = await page
      .locator('meta[property="og:url"]')
      .getAttribute("content");
    expect(ogUrl ? new URL(ogUrl).href : null).toBe(new URL(route.canonical).href);

    const ogImage = await page
      .locator('meta[property="og:image"]')
      .first()
      .getAttribute("content");
    const expectedOgImage = new URL(route.ogImage);
    expectedOgImage.pathname = expectedOgImage.pathname.replace(
      "/assets/images/",
      "/media/",
    );
    expect(ogImage ? new URL(ogImage).href : null).toBe(expectedOgImage.href);

    const robotsMeta = page.locator('meta[name="robots"]');
    const robots = (await robotsMeta.count())
      ? await robotsMeta.getAttribute("content")
      : null;
    if (route.robots.includes("noindex")) {
      expect(robots).toMatch(/noindex/i);
    } else {
      expect(robots ?? "").not.toMatch(/noindex/i);
    }

    const schemaTypes = await schemaTypesOnPage(page);
    for (const schemaType of route.schemaTypes) {
      expect(schemaTypes).toContain(schemaType);
    }

    const hrefs = await page.locator("a[href]").evaluateAll((anchors) =>
      anchors.map((anchor) => anchor.getAttribute("href")).filter(Boolean),
    );
    for (const href of directContactHrefs) expect(hrefs).toContain(href);

    const preservedRouteContacts =
      route.path === "/"
        ? []
        : route.contactHrefs.filter(
            (href) => !href.endsWith("%20I") && !href.endsWith("?subject="),
          );
    for (const href of preservedRouteContacts) expect(hrefs).toContain(href);

    await expect(page.locator("body")).not.toContainText(
      /message sent|consultation booked|booking confirmed/i,
    );
  });

  for (const variant of route.pathVariants) {
    if (variant === route.path) continue;

    test(`${variant} resolves to ${route.path}`, async ({ page }) => {
      const response = await page.goto(variant);

      expect(response?.status()).toBe(200);
      expect(normalizePath(new URL(page.url()).pathname)).toBe(route.path);
      await expect(page.locator("h1").first()).toContainText(
        approvedRedesignHeadings[route.path] ?? route.primaryHeading,
      );
    });
  }
}

const missingRoute = legacyRoutes.routes.find(
  (route) => route.expectedStatus === 404,
);

if (!missingRoute) throw new Error("The frozen route contract needs its 404 entry.");

for (const variant of missingRoute.pathVariants) {
  test(`${variant} preserves the branded 404 status`, async ({ page }) => {
    const response = await page.goto(variant);

    expect(response?.status()).toBe(404);
    await expect(page).toHaveTitle(missingRoute.title);
    await expect(page.locator("h1")).toContainText("This page doesn't exist.");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/i,
    );
  });
}

test("legacy social and media URLs resolve to approved local assets", async ({
  request,
}) => {
  const aliases = [
    ["/assets/images/iffykhan-og.jpg", "/media/iffykhan-og.jpg"],
    [
      "/assets/images/og-areas/business-bay.jpg",
      "/media/og-areas/business-bay.jpg",
    ],
    ["/assets/images/favicon.svg", "/media/favicon.svg"],
    ["/assets/videos/iffy-hero.mp4", "/media/iffy-hero.mp4"],
    ["/assets/images/palm-before.webp", "/media/palm-jumeirah.webp"],
  ] as const;

  for (const [legacyPath, currentPath] of aliases) {
    const response = await request.get(legacyPath, { maxRedirects: 0 });

    expect(response.status()).toBe(301);
    expect(new URL(response.headers().location, "http://127.0.0.1:3000").pathname).toBe(
      currentPath,
    );
  }
});

test("the Worker applies security and cache headers to generated output", async ({
  page,
  request,
}) => {
  const htmlResponse = await request.get("/about");
  const htmlHeaders = htmlResponse.headers();

  expect(htmlResponse.status()).toBe(200);
  expect(htmlHeaders["strict-transport-security"]).toBe("max-age=15552000");
  expect(htmlHeaders["x-content-type-options"]).toBe("nosniff");
  expect(htmlHeaders["x-frame-options"]).toBe("SAMEORIGIN");
  expect(htmlHeaders["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(htmlHeaders["permissions-policy"]).toBe(
    "camera=(), microphone=(), geolocation=()",
  );

  const mediaResponse = await request.get("/media/iffykhan-og.jpg");
  expect(mediaResponse.status()).toBe(200);
  expect(mediaResponse.headers()["cache-control"]).toContain("max-age=2592000");

  await page.goto("/");
  const staticAssetPath = await page
    .locator('script[src^="/_next/static/"]')
    .first()
    .getAttribute("src");
  expect(staticAssetPath).toBeTruthy();

  const staticAssetResponse = await request.get(staticAssetPath!);
  expect(staticAssetResponse.status()).toBe(200);
  expect(staticAssetResponse.headers()["cache-control"]).toContain("max-age=31536000");
  expect(staticAssetResponse.headers()["cache-control"]).toContain("immutable");
});

test("an unknown route returns the branded noindex 404", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle(/Page Not Found/);
  await expect(page.locator("h1")).toContainText("This page doesn't exist.");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/i,
  );
});

test("mobile navigation closes on Escape and restores the document", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");

  const trigger = page.getByRole("button", { name: "Open navigation" });
  await trigger.click();
  await expect(page.locator("#mobile-navigation")).toBeVisible();
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");

  await page.keyboard.press("Escape");
  await expect(page.locator("#mobile-navigation")).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});

test("mobile navigation stays concise and traps focus through its close control", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Open navigation" }).click();
  const navigation = page.getByRole("navigation", { name: "Mobile navigation" });
  await expect(navigation.getByRole("link")).toHaveText([
    "Buy",
    "Sell",
    "About",
    "Talk to me",
  ]);

  const buy = navigation.getByRole("link", { name: "Buy", exact: true });
  await expect(buy).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Close navigation" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(buy).toBeFocused();
});

test("mobile navigation closes when the viewport crosses to desktop", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about");
  await page.getByRole("button", { name: "Open navigation" }).click();

  await page.setViewportSize({ width: 1200, height: 800 });
  await expect(page.locator("#mobile-navigation")).toBeHidden();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  await expect(page.getByRole("link", { name: "Iffy Khan home" })).toBeFocused();
});
