import type { ImgHTMLAttributes } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SiteFooter } from "@/components/site/site-footer";
import { navigation, site } from "@/content/site";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element -- Test double for next/image.
    <img {...props} alt={props.alt ?? ""} />
  ),
}));

describe("SiteFooter", () => {
  it("finishes with one clear contact route and a restrained verified directory", () => {
    const { container } = render(<SiteFooter />);
    const footer = container.querySelector("footer");

    expect(footer).not.toBeNull();
    expect(
      within(footer as HTMLElement).getByRole("link", { name: "Talk to me" }),
    ).toHaveAttribute("href", "/?intent=not-sure#consultation");

    const footerNavigation = within(footer as HTMLElement).getByRole("navigation", {
      name: "Footer navigation",
    });
    navigation.forEach((item) => {
      expect(
        within(footerNavigation).getByRole("link", { name: item.label }),
      ).toHaveAttribute("href", item.href);
    });
    expect(within(footerNavigation).getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/privacy",
    );

    expect(screen.getByRole("link", { name: site.phoneDisplay })).toHaveAttribute(
      "href",
      `tel:${site.phoneE164}`,
    );
    expect(screen.getByRole("link", { name: "WhatsApp" })).toHaveAttribute(
      "href",
      `https://wa.me/${site.whatsappNumber}`,
    );
    expect(screen.getByRole("link", { name: site.email })).toHaveAttribute(
      "href",
      `mailto:${site.email}`,
    );
    expect(screen.getByText(`Licence ${site.licence} · ${site.agency} ORN ${site.orn}`)).toBeVisible();
    expect(screen.getByText(site.disclaimer)).toBeVisible();
  });
});
