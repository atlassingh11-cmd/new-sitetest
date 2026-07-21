import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Consultation } from "@/components/landing/consultation";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

describe("Consultation external handoff", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-12T12:00:00.000Z"));
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
    vi.stubGlobal("scrollTo", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reveals one decision at a time and permits a no-time handoff", () => {
    render(<Consultation />);

    expect(
      screen.getByRole("group", { name: "What are you weighing up?" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("textbox", { name: "What should I call you?" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: "Selling" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "What should I call you?" }),
      { target: { value: "Amina" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));

    expect(
      screen.getByRole("heading", { name: "Would a time help?" }),
    ).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "No time preference" }),
    );
    expect(
      screen.getByRole("heading", { name: "Ready when you are." }),
    ).toBeVisible();
  });

  it("revalidates a preferred day before opening an external app", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    render(<Consultation />);

    fireEvent.click(screen.getByRole("radio", { name: "Buying" }));
    fireEvent.change(screen.getByRole("textbox", { name: "What should I call you?" }), {
      target: { value: "Amina" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "Choose a preferred time" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Monday, 13 July 2026" }),
    );
    fireEvent.click(
      screen.getByRole("radio", { name: "Morning, 9am to 12pm" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Use this time/ }));
    expect(
      screen.getByRole("heading", { name: "Ready when you are." }),
    ).toBeVisible();

    act(() => {
      vi.advanceTimersByTime(8 * 60 * 60 * 1_000 + 100);
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Continue on WhatsApp" }),
    );

    expect(open).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Choose a day from tomorrow onwards in Dubai.",
    );
    expect(
      screen.getByRole("heading", { name: "Would a time help?" }),
    ).toBeVisible();
  });

  it("reveals the message and direct contacts when an external app does not open", () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    render(<Consultation />);

    fireEvent.click(screen.getByRole("radio", { name: "Selling" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "What should I call you?" }),
      { target: { value: "Amina" } },
    );
    fireEvent.click(screen.getByRole("button", { name: /^Continue$/ }));
    fireEvent.click(
      screen.getByRole("button", { name: "No time preference" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Continue on WhatsApp" }),
    );

    expect(screen.getByText("Review message").closest("details")).toHaveAttribute(
      "open",
    );
    expect(
      screen.getByText(
        "If nothing opened, copy the message below or use a direct contact link.",
      ),
    ).toBeVisible();
  });
});
