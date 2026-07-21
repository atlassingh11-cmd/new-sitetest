import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ClientProof } from "@/components/landing/client-proof";

describe("ClientProof", () => {
  it("keeps the full testimonial readable while exposing shared motion hooks", () => {
    const { container } = render(<ClientProof />);
    const section = container.querySelector("[data-quote-chapter]");
    const words = Array.from(
      container.querySelectorAll<HTMLElement>("[data-quote-word]"),
    );
    const quote = container.querySelector("blockquote");

    expect(section).toBeInTheDocument();
    expect(words).toHaveLength(Number(section?.getAttribute("data-highlighted-words")));
    expect(quote).toHaveTextContent(
      /I never felt any stress or pressure/,
    );
    expect(words.map((word) => word.textContent).join(" ")).toBe(
      quote?.textContent,
    );
  });
});
