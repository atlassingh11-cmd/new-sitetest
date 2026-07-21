import type { ImgHTMLAttributes } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AdviceRoutes } from "@/components/landing/advice-routes";
import { ClientProof } from "@/components/landing/client-proof";
import { EditorialInspection } from "@/components/landing/editorial-inspection";

vi.mock("next/image", () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; priority?: boolean }) => {
    const { fill, priority, ...imageProps } = props;
    void fill;
    void priority;
    return (
      // The production component reserves intrinsic geometry through Next Image.
      // eslint-disable-next-line @next/next/no-img-element
      <img {...imageProps} alt={imageProps.alt ?? ""} />
    );
  },
}));

describe("landing narrative", () => {
  it("puts the buyer and seller routes in the static tree", () => {
    render(<AdviceRoutes />);

    expect(screen.getByRole("heading", { name: "Buy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sell" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Find a home to live in/ })).toHaveAttribute("href", "/?intent=buying#consultation");
    expect(screen.getByRole("link", { name: /Build an investment brief/ })).toHaveAttribute("href", "/?intent=investing#consultation");
    expect(screen.getByRole("link", { name: /Set the right asking price/ })).toHaveAttribute("href", "/?intent=selling#consultation");
    expect(screen.getAllByRole("link")).toHaveLength(6);
  });

  it("uses only the existing attributed review excerpt", () => {
    const { container } = render(<ClientProof />);

    expect(screen.getByText("Oisin W, Home Buyer, Dubai")).toBeInTheDocument();
    expect(container.querySelector("blockquote")).toHaveTextContent(
      /I never felt any stress or pressure/,
    );
  });

  it("uses a single static inspection image between proof and tools", () => {
    const { container } = render(<EditorialInspection />);

    const image = screen.getByRole("img", {
      name: /Keys, a floor plan, notebook and laser measure/,
    });
    expect(image).toHaveAttribute("src", "/media/inspection-editorial.webp");
    expect(container.querySelector("[data-inspection-sticky]")).toContainElement(image);
  });
});
