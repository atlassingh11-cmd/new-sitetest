import { expect, test } from "@playwright/test";

test.describe("trust-first landing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("communicates the offer and gives buying and selling distinct routes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Advice you can hold me to.", exact: true })).toBeVisible();

    const buying = page.getByRole("heading", { name: "Buy", exact: true });
    const selling = page.getByRole("heading", { name: "Sell", exact: true });
    await expect(buying).toBeVisible();
    await expect(selling).toBeVisible();

    const buyingY = await buying.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
    const sellingY = await selling.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
    expect(sellingY).toBeGreaterThan(buyingY);
    await expect(page.getByRole("link", { name: /Build an investment brief/ })).toHaveAttribute(
      "href",
      "/?intent=investing#consultation",
    );
  });

  test("routes the mobile Selling link to the Sell panel", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page
      .getByLabel("Mobile navigation")
      .getByRole("link", { name: "Sell", exact: true })
      .click();

    await expect(page).toHaveURL(/intent=selling#selling$/);
    await expect(
      page.locator("#selling").getByRole("heading", {
        name: "Sell",
        exact: true,
      }),
    ).toBeVisible();
    await expect(page.locator("#selling")).toContainText(
      "A clear route from the first pricing conversation to handover.",
    );
  });

  test("keeps the advisor film out of the request graph until Play", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));

    await page.goto("/");
    const play = page.getByRole("button", { name: "Play the Meet Iffy film" });
    await play.scrollIntoViewIfNeeded();
    await expect(play).toBeVisible();

    expect(requests.some((url) => url.endsWith("/media/iffy-film.mp4"))).toBe(false);
    await play.click();
    await expect.poll(() => requests.some((url) => url.endsWith("/media/iffy-film.mp4"))).toBe(true);
  });

  test("shows recovery guidance when advisor-film playback fails", async ({ page }) => {
    await page.route("**/media/iffy-film.mp4", (route) => route.abort());
    await page.goto("/");

    await page.getByRole("button", { name: "Play the Meet Iffy film" }).click();
    await expect(
      page.getByText(/The film could not (?:load|play)\. Try again\./),
    ).toBeVisible();
    await expect(page.getByText("Read what the film covers")).toHaveCount(0);
  });

  test("shows the normal-motion hero immediately without a blocking curtain", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");

    await expect(page.locator("[data-arc-phase]")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Advice you can hold me to." })).toBeVisible();
    await expect(page.locator("[data-hero-media]")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Talk to me" }).first()).toBeVisible();
  });

  test("uses local media and avoids banned display punctuation", async ({ page }) => {
    await page.goto("/");
    const html = await page.content();
    const visibleText = await page.locator("body").innerText();

    expect(html).not.toMatch(/unsplash|figma\.com|picsum/i);
    expect(visibleText).not.toMatch(/[—–]/);
  });
});
