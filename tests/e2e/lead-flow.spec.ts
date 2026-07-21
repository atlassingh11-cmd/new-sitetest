import { expect, test } from "@playwright/test";

test.describe("consultation handoff", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?intent=investing#consultation");
    await expect(
      page.getByRole("heading", { name: "Tell me what you're weighing up." }),
    ).toBeVisible();
    await expect(page.getByLabel("What should I call you?")).toBeVisible();
  });

  test("keeps PII out of the site URL and allows a no-time route", async ({ page }) => {
    await page.getByLabel("What should I call you?").fill("Amina Khan");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "No time preference" }).click();

    await expect(page.getByRole("heading", { name: "Ready when you are." })).toBeVisible();
    expect(page.url()).toContain("intent=investing");
    expect(page.url()).not.toContain("Amina");
    const consultation = page.locator("#consultation");
    await expect(
      consultation.getByRole("button", { name: "Continue on WhatsApp" }),
    ).toBeVisible();
    await expect(
      consultation.getByRole("button", { name: "Draft an email" }),
    ).toBeVisible();
    await consultation.getByText("Review message", { exact: true }).click();
    await expect(
      consultation.getByText("I have not chosen a preferred day or time."),
    ).toBeVisible();
    await expect(consultation.locator("pre")).toContainText(
      "I would like your advice on buying an investment property.",
    );
    await expect(
      consultation.getByRole("link", { name: /WhatsApp \+971/ }),
    ).toBeVisible();
    await expect(
      consultation.getByRole("link", { name: "iffy@kamaniliving.com" }),
    ).toBeVisible();
  });

  test("validates the first required field and does not claim an appointment", async ({ page }) => {
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.getByLabel("What should I call you?")).toBeFocused();
    await expect(page.locator("#consultation").getByRole("alert")).toContainText("Enter your name");

    await page.getByLabel("What should I call you?").fill("Amina");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "No time preference" }).click();
    const consultation = page.locator("#consultation");
    await expect(consultation).not.toContainText(/booked|appointment confirmed/i);
    await expect(page.getByRole("button", { name: "Continue on WhatsApp" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Draft an email" })).toBeVisible();
  });

  test("carries a preferred Dubai day and window into the draft without confirming it", async ({ page }) => {
    await page.getByLabel("What should I call you?").fill("Amina Khan");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Choose a preferred time" }).click();
    const firstAvailableDay = page
      .getByRole("grid")
      .locator("button:not(:disabled)")
      .first();
    await expect(firstAvailableDay).toBeVisible();
    const chosenDay = await firstAvailableDay.getAttribute("aria-label");
    expect(chosenDay).toBeTruthy();
    await firstAvailableDay.click();
    const afternoon = page.getByRole("radio", {
      name: "Afternoon, 12pm to 4pm",
    });
    await afternoon.check();
    await expect(afternoon).toBeChecked();
    await page.getByRole("button", { name: "Use this time" }).click();

    const consultation = page.locator("#consultation");
    await consultation.getByText("Review message", { exact: true }).click();
    const draft = consultation.locator("pre");
    await expect(draft).toContainText(chosenDay!);
    await expect(draft).toContainText("Afternoon");
    await expect(draft).toContainText(
      "This is only a preference. The exact time still needs to be agreed.",
    );
    await expect(consultation).not.toContainText(/booked|appointment confirmed/i);
  });

  test("updates intent after following a selling route", async ({ page }) => {
    await page.getByRole("link", { name: /Set the right asking price/ }).click();

    await expect(page).toHaveURL(/intent=selling#consultation$/);
    await expect(page.getByLabel("What should I call you?")).toBeVisible();
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByRole("radio", { name: /Selling/ })).toBeChecked();
    await expect(page.getByRole("radio", { name: /Investing/ })).not.toBeChecked();
  });

  test("keeps the consultation anchored after tools hydrate above it", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await expect(page.getByLabel("What should I call you?")).toBeVisible();
    await page.waitForTimeout(1700);

    const consultationTop = await page
      .locator("#consultation")
      .evaluate((element) => element.getBoundingClientRect().top);
    expect(consultationTop).toBeGreaterThanOrEqual(60);
    expect(consultationTop).toBeLessThanOrEqual(72);
  });

  test("keeps the preferred-time calendar inside a narrow mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.getByLabel("What should I call you?").fill("Amina Khan");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.getByRole("button", { name: "Choose a preferred time" }).click();

    const calendar = page.getByRole("group", {
      name: "Dubai time. This is a preference, not a booking.",
    });
    await expect(calendar).toBeVisible();

    const geometry = await page.evaluate(() => {
      const calendarElement = document.querySelector<HTMLElement>(
        ".consultation-calendar-float",
      );
      if (!calendarElement) throw new Error("Calendar did not render");
      const rect = calendarElement.getBoundingClientRect();
      return {
        calendarLeft: rect.left,
        calendarRight: rect.right,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });

    expect(geometry.calendarLeft).toBeGreaterThanOrEqual(0);
    expect(geometry.calendarRight).toBeLessThanOrEqual(
      geometry.clientWidth + 1,
    );
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
    await expect(page.getByRole("grid")).toBeVisible();
    await expect(page.getByRole("button", { name: "Choose a day" })).toBeVisible();
  });
});
