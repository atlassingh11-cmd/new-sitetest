import type { ImgHTMLAttributes } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdvisorProof } from "@/components/landing/advisor-proof";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => {
    const { fill, ...imageProps } = props;
    void fill;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Test double for next/image.
      <img {...imageProps} alt={imageProps.alt ?? ""} />
    );
  },
}));

describe("AdvisorProof", () => {
  it("keeps the film before fully readable biography copy", () => {
    const { container } = render(<AdvisorProof />);

    expect(screen.getByRole("button", { name: "Play the Meet Iffy film" })).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "The recommendation has to be right, even when it costs a sale.",
      }),
    ).toBeVisible();
    expect(screen.getByText(/stay accountable through completion/)).toBeVisible();
    expect(container.querySelector("[data-scroll-story]")).not.toBeInTheDocument();

    const film = screen.getByRole("button", {
      name: "Play the Meet Iffy film",
    });
    const heading = screen.getByRole("heading", {
      name: "The recommendation has to be right, even when it costs a sale.",
    });
    expect(
      film.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
