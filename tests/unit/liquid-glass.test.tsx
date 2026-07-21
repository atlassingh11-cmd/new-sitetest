import * as React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LiquidGlass } from "@/components/ui/liquid-glass";

describe("LiquidGlass", () => {
  afterEach(cleanup);

  it("keeps link semantics and forwards its ref", () => {
    const ref = React.createRef<HTMLAnchorElement>();
    render(
      <LiquidGlass href="#about-iffy" ref={ref}>
        Meet me in 90 seconds
      </LiquidGlass>,
    );

    const link = screen.getByRole("link", { name: "Meet me in 90 seconds" });
    expect(link).toHaveAttribute("href", "#about-iffy");
    expect(link).toHaveAttribute("data-liquid-glass");
    expect(ref.current).toBe(link);
  });

  it("renders a native button with the supplied liquid-glass layers", () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(
      <LiquidGlass ref={ref} tone="dark">
        Continue
      </LiquidGlass>,
    );

    const button = screen.getByRole("button", { name: "Continue" });
    expect(button).toHaveAttribute("type", "button");
    expect(button.className).toContain("min-h-11");
    expect(button.className).toContain("duration-500");
    expect(button.className).not.toContain("ring-2");
    expect(button.className).toContain("forced-colors:border");
    expect(button.className).not.toContain("hover:px");
    expect(button.querySelector("filter")).toBeInTheDocument();
    expect(
      button.querySelector("feDisplacementMap"),
    ).toHaveAttribute("scale", "200");
    expect(button.innerHTML).not.toContain("-z-10");
    const refraction = button.querySelector<HTMLElement>(
      "[data-liquid-glass-refraction]",
    );
    expect(refraction).toBeInTheDocument();
    expect(refraction?.style.backdropFilter).toContain("blur(3px)");
    expect(refraction?.style.filter).toMatch(/liquid-glass-/);
    const tint = button.querySelector<HTMLElement>(
      "[data-liquid-glass-tint='dark']",
    );
    expect(tint).toBeInTheDocument();
    expect(tint?.style.background).toContain("rgba(223, 247, 241, 0.07)");
    const specular = button.querySelector<HTMLElement>(
      "[data-liquid-glass-specular]",
    );
    expect(specular?.style.boxShadow).toBe(
      "inset 0 1px 0 rgba(255, 255, 255, 0.5)",
    );
    expect(specular?.style.boxShadow).not.toContain("-1px");
    expect(ref.current).toBe(button);
  });
});
