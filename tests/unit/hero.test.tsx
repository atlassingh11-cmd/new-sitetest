import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Hero } from "@/components/landing/hero";

vi.mock("next/image", () => ({
  default: ({ alt, fill, priority, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & {
    fill?: boolean;
    priority?: boolean;
  }) => {
    void fill;
    void priority;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Test double for next/image.
      <img alt={alt} {...props} />
    );
  },
}));

describe("Hero", () => {
  afterEach(cleanup);

  it("presents one clear advisory message and route into consultation", () => {
    render(<Hero />);

    expect(
      screen.getByRole("heading", { name: "Advice you can hold me to." }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Talk to me" })).toHaveAttribute(
      "href",
      "/?intent=not-sure#consultation",
    );
  });

  it("uses a stable portrait and keeps the film as a secondary action", () => {
    const { container } = render(<Hero />);

    const scene = container.querySelector("[data-hero-scene]");
    expect(scene).toHaveClass("hero-scene");
    expect(scene?.querySelector("[data-hero-stage]")).toHaveClass(
      "hero-shell",
    );
    expect(container.querySelectorAll("[data-hero-media]")).toHaveLength(1);
    expect(container.querySelectorAll("[data-hero-parallax]")).toHaveLength(1);
    expect(
      screen.getByRole("img", {
        name: "Iffy Khan smiling while speaking with a client",
      }),
    ).toHaveAttribute("src", "/media/iffy-hero-poster.webp");
    expect(
      screen.getByRole("link", { name: "Meet me in 90 seconds" }),
    ).toHaveAttribute("href", "#about-iffy");
    expect(scene?.querySelectorAll("[data-liquid-glass]")).toHaveLength(2);
    expect(container.querySelector("video")).not.toBeInTheDocument();
  });
});
