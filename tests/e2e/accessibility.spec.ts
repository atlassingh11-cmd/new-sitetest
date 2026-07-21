import { expect, test } from "@playwright/test";

test("mobile visitors can navigate the static export without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  await page.goto("/");
  const staticNavigation = page.getByRole("navigation", {
    name: "Navigation without JavaScript",
  });
  await expect(staticNavigation).toBeVisible();
  await expect(
    staticNavigation.getByRole("link", { name: "Areas", exact: true }),
  ).toBeVisible();
  await expect(page.locator("#tools")).toHaveCSS("position", "relative");

  await context.close();
});

test.describe("accessibility contract", () => {
  test("honours reduced motion and preserves the full static page", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.locator("[data-arc-phase]")).toHaveCount(0);
    const heroMedia = page.locator("[data-hero-media]");
    await expect(heroMedia).toBeVisible();
    await expect(heroMedia).toHaveCSS("transform", "none");
    await page.evaluate(() => window.scrollTo({ top: 320 }));
    await expect(heroMedia).toHaveCSS("transform", "none");
    await expect(
      page.getByRole("img", {
        name: /Keys, a floor plan, notebook and laser measure/,
      }),
    ).toBeVisible();
    await expect(page.locator("[data-inspection-sticky]")).toHaveCSS(
      "position",
      "relative",
    );
    await expect(page.locator("#tools")).toHaveCSS("margin-top", "0px");
    await expect(
      page.locator("[data-parallax-static], [data-parallax-motion]"),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", {
        name: "Advice you can hold me to.",
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Tell me what you're weighing up." }),
    ).toBeVisible();
  });

  test("provides labelled consultation controls and a visible keyboard focus", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/#consultation");

    const intentGroup = page.getByRole("group", {
      name: "What are you weighing up?",
    });
    await expect(intentGroup).toBeVisible();
    await intentGroup.getByRole("radio", { name: "Buying" }).click();

    const name = page.getByLabel("What should I call you?");
    await expect(name).toBeVisible();
    await name.focus();
    await expect(name).toBeFocused();

    const outline = await name.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return `${style.outlineStyle} ${style.boxShadow}`;
    });
    expect(outline).not.toBe("none none");

    await name.fill("Amina");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    const timingDisclosure = page.getByRole("button", {
      name: "Choose a preferred time",
    });
    await expect(timingDisclosure).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("grid")).toHaveCount(0);

    await timingDisclosure.click();
    await expect(
      page.getByRole("button", { name: "Hide the calendar" }),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("group", {
        name: "Dubai time. This is a preference, not a booking.",
      }),
    ).toBeVisible();
  });
});
