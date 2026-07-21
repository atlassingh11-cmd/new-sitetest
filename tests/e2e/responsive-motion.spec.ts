import { expect, test } from "@playwright/test";

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 844, height: 390 },
  { width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`has stable document geometry at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const geometry = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      viewport: window.innerHeight,
    }));

    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
    expect(geometry.height).toBeGreaterThan(geometry.viewport * 3);
    await expect(page.locator("footer")).toBeAttached();
  });
}

test("desktop hero stays pinned while its media moves and glass actions align", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute(
    "data-scroll-motion",
    "active",
  );

  const hero = page.locator("[data-hero-scene]");
  const stage = page.locator("[data-hero-stage]");
  const media = page.locator("[data-hero-media]");
  const glassActions = page.locator(
    '[aria-label="Hero actions"] [data-liquid-glass]',
  );

  await expect(hero).toBeVisible();
  await expect(glassActions).toHaveCount(2);
  await expect(stage).toHaveCSS("position", "sticky");

  const initialTransform = await media.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  const actionBoxes = await glassActions.evaluateAll((elements) =>
    elements.map((element) => {
      const rect = element.getBoundingClientRect();
      return { height: rect.height, top: rect.top };
    }),
  );

  expect(
    Math.abs(actionBoxes[0].height - actionBoxes[1].height),
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(actionBoxes[0].top - actionBoxes[1].top),
  ).toBeLessThanOrEqual(1);

  const scrollTarget = await hero.evaluate(
    (element) => Math.round(element.getBoundingClientRect().height * 0.34),
  );
  await page.evaluate((top) => window.scrollTo({ top }), scrollTarget);

  await expect
    .poll(() =>
      media.evaluate((element) => getComputedStyle(element).transform),
    )
    .not.toBe(initialTransform);

  const stageTop = await stage.evaluate(
    (element) => element.getBoundingClientRect().top,
  );
  expect(stageTop).toBeGreaterThanOrEqual(62);
  expect(stageTop).toBeLessThanOrEqual(66);

  const progress = await hero.evaluate((element) =>
    Number.parseFloat(
      getComputedStyle(element).getPropertyValue("--hero-progress") || "0",
    ),
  );
  expect(progress).toBeGreaterThan(0.1);
});

test("mobile advisor proof clears the testimonial and keeps one content axis", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const storyLink = page.getByRole("link", { name: "Read Iffy's story" });
  const testimonial = page.locator("#testimonials");
  const testimonialContent = testimonial.locator("figure");

  const geometry = await page.evaluate(() => {
    const link = [...document.querySelectorAll("a")].find(
      (element) => element.textContent?.trim() === "Read Iffy's story",
    );
    const section = document.querySelector<HTMLElement>("#testimonials");
    const figure = section?.querySelector<HTMLElement>("figure");
    if (!link || !section || !figure) return null;

    const linkRect = link.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    const figureRect = figure.getBoundingClientRect();
    return {
      linkBottom: linkRect.bottom + window.scrollY,
      sectionTop: sectionRect.top + window.scrollY,
      linkLeft: linkRect.left,
      figureLeft: figureRect.left,
    };
  });

  expect(geometry).not.toBeNull();
  expect(geometry!.linkBottom).toBeLessThan(geometry!.sectionTop);
  expect(Math.abs(geometry!.linkLeft - geometry!.figureLeft)).toBeLessThanOrEqual(1);
  await expect(storyLink).toBeAttached();
  await expect(testimonialContent).toBeAttached();
});

test("mobile tools sheet scrolls over the pinned inspection with separated choices", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "Real wheel input is validated in the Chromium project.",
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const wrapper = page.locator("[data-inspection-tools-reveal]");
  const inspection = page.locator("[data-inspection-sticky]");
  const tools = page.locator("#tools");

  await expect(wrapper).toBeVisible();
  await expect(inspection).toHaveCSS("position", "sticky");
  await wrapper.evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo(0, top);
  });
  await expect
    .poll(() =>
      inspection.evaluate((element) =>
        Math.abs(element.getBoundingClientRect().top - 64),
      ),
    )
    .toBeLessThanOrEqual(2);

  const before = await page.evaluate(() => {
    const image = document.querySelector<HTMLElement>("[data-inspection-sticky]");
    const toolsSection = document.querySelector<HTMLElement>("#tools");
    if (!image || !toolsSection) return null;
    return {
      imageTop: image.getBoundingClientRect().top,
      toolsTop: toolsSection.getBoundingClientRect().top,
    };
  });

  expect(before).not.toBeNull();
  await page.mouse.wheel(0, 450);
  await expect
    .poll(() => tools.evaluate((element) => element.getBoundingClientRect().top))
    .toBeLessThan(before!.toolsTop - 300);

  const after = await page.evaluate(() => {
    const image = document.querySelector<HTMLElement>("[data-inspection-sticky]");
    const toolsSection = document.querySelector<HTMLElement>("#tools");
    if (!image || !toolsSection) return null;
    const imageRect = image.getBoundingClientRect();
    const toolsRect = toolsSection.getBoundingClientRect();
    const point = document.elementFromPoint(
      Math.min(window.innerWidth - 2, Math.max(2, toolsRect.left + toolsRect.width / 2)),
      Math.min(window.innerHeight - 2, Math.max(2, toolsRect.top + 8)),
    );
    return {
      imageBottom: imageRect.bottom,
      imageTop: imageRect.top,
      pointIsTools: Boolean(point?.closest("#tools")),
      toolsTop: toolsRect.top,
    };
  });

  expect(after).not.toBeNull();
  expect(Math.abs(after!.imageTop - before!.imageTop)).toBeLessThanOrEqual(2);
  expect(after!.imageTop).toBeGreaterThanOrEqual(62);
  expect(after!.imageTop).toBeLessThanOrEqual(66);
  expect(after!.toolsTop).toBeLessThan(after!.imageBottom);
  expect(after!.pointIsTools).toBe(true);

  const cardGaps = await page.locator(".tool-stack__card").evaluateAll((cards) =>
    cards.slice(1).map((card, index) => {
      const previous = cards[index].getBoundingClientRect();
      return card.getBoundingClientRect().top - previous.bottom;
    }),
  );
  expect(cardGaps).toHaveLength(2);
  cardGaps.forEach((gap) => expect(gap).toBeGreaterThanOrEqual(10));
});

test("mobile consultation sheet scrolls over the pinned tools", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "mobile",
    "Real wheel input is validated in the Chromium project.",
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const tools = page.locator("#tools");
  const consultation = page.locator("#consultation");

  await expect(consultation).toBeAttached();
  await tools.evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY - 64;
    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo({ left: 0, top, behavior: "auto" });
    root.style.scrollBehavior = previousBehavior;
  });
  await expect
    .poll(() =>
      tools.evaluate((element) =>
        Math.abs(element.getBoundingClientRect().top - 64),
      ),
    )
    .toBeLessThanOrEqual(2);

  const before = await page.evaluate(() => {
    const toolsSection = document.querySelector<HTMLElement>("#tools");
    const consultationSection = document.querySelector<HTMLElement>("#consultation");
    if (!toolsSection || !consultationSection) return null;
    return {
      consultationTop: consultationSection.getBoundingClientRect().top,
      scrollY: window.scrollY,
      toolsTop: toolsSection.getBoundingClientRect().top,
    };
  });

  expect(before).not.toBeNull();
  await page.mouse.wheel(0, 520);
  await expect
    .poll(() => consultation.evaluate((element) => element.getBoundingClientRect().top))
    .toBeLessThan(before!.consultationTop - 300);

  const after = await page.evaluate(() => {
    const toolsSection = document.querySelector<HTMLElement>("#tools");
    const consultationSection = document.querySelector<HTMLElement>("#consultation");
    if (!toolsSection || !consultationSection) return null;
    const toolsRect = toolsSection.getBoundingClientRect();
    const consultationRect = consultationSection.getBoundingClientRect();
    const sampleY = Math.min(
      window.innerHeight - 2,
      Math.max(2, consultationRect.top + 8),
    );
    const point = document.elementFromPoint(window.innerWidth / 2, sampleY);
    return {
      consultationOpacity: getComputedStyle(consultationSection).opacity,
      consultationTop: consultationRect.top,
      pointIsConsultation: Boolean(point?.closest("#consultation")),
      scrollY: window.scrollY,
      toolsBottom: toolsRect.bottom,
      toolsTop: toolsRect.top,
      viewportHeight: window.innerHeight,
    };
  });

  expect(after).not.toBeNull();
  expect(after!.scrollY).toBeGreaterThan(before!.scrollY);
  expect(after!.consultationOpacity).toBe("1");
  expect(after!.toolsTop).toBeLessThan(before!.toolsTop);
  expect(
    Math.abs(after!.toolsBottom - after!.viewportHeight),
  ).toBeLessThanOrEqual(8);
  expect(after!.consultationTop).toBeLessThan(after!.toolsBottom);
  expect(after!.pointIsConsultation).toBe(true);
});

test("mobile consultation portrait uses a deliberate square crop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#consultation");

  const consultation = page.locator("#consultation");
  const media = consultation.locator(".consultation-media");
  const portrait = media.locator(".consultation-media__person");

  await expect(consultation).toBeVisible();
  await expect(portrait).toBeVisible();
  await expect
    .poll(() =>
      media.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }),
    )
    .toBe(true);

  const crop = await media.evaluate((element) => {
    const portrait = element.querySelector<HTMLElement>(".consultation-media__person");
    if (!portrait) return null;
    const mediaRect = element.getBoundingClientRect();
    const mediaStyle = getComputedStyle(element);
    const portraitStyle = getComputedStyle(portrait);
    return {
      aspectRatio: mediaRect.width / mediaRect.height,
      calendarOpen: element.getAttribute("data-calendar-open"),
      height: mediaRect.height,
      objectFit: portraitStyle.objectFit,
      objectPosition: portraitStyle.objectPosition,
      overflow: mediaStyle.overflow,
      portraitHeight: portrait.clientHeight,
      portraitWidth: portrait.clientWidth,
      width: mediaRect.width,
    };
  });

  expect(crop).not.toBeNull();
  expect(crop!.aspectRatio).toBeGreaterThanOrEqual(0.99);
  expect(crop!.aspectRatio).toBeLessThanOrEqual(1.01);
  expect(crop!.height).toBeLessThanOrEqual(390);
  expect(crop!.portraitWidth).toBeCloseTo(crop!.width, 0);
  expect(crop!.portraitHeight).toBeCloseTo(crop!.height, 0);
  expect(crop!.overflow).toBe("hidden");
  expect(crop!.objectFit).toBe("cover");
  expect(crop!.objectPosition).toBe("50% 24%");
  expect(crop!.calendarOpen).toBe("false");
});
