import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DeferredConsultation } from "@/components/landing/deferred-islands";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

type ObserverCallback = ConstructorParameters<typeof IntersectionObserver>[0];

function holdDeferredIslands() {
  let callback: ObserverCallback | undefined;
  const disconnect = vi.fn();
  const observe = vi.fn();

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "800px 0px";
    readonly thresholds = [0];

    constructor(nextCallback: ObserverCallback) {
      callback = nextCallback;
    }

    disconnect = disconnect;
    observe = observe;
    takeRecords = () => [];
    unobserve = vi.fn();
  }

  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

  return {
    enter: async () => {
      if (!callback) throw new Error("Deferred island was not observed.");
      await act(async () => {
        callback?.(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
        // Let Vite resolve the deferred module and React commit the state
        // change before the assertion leaves `act`.
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      });
    },
    observe,
  };
}

describe("deferred landing islands", () => {
  beforeEach(() => {
    vi.stubGlobal("scrollTo", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    window.history.replaceState({}, "", "/");
  });

  it("keeps consultation copy and direct contact in the static shell", () => {
    const observer = holdDeferredIslands();
    render(<DeferredConsultation />);

    expect(
      screen.getByRole("heading", {
        name: "Tell me what you're weighing up.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: /WhatsApp \+971/ }),
    ).toHaveAttribute("href", "https://wa.me/971585802689");
    expect(screen.queryByLabelText("Your name")).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "Iffy Khan reviewing a property brief",
      }),
    ).toBeVisible();
    expect(observer.observe).toHaveBeenCalledOnce();
  });

  it(
    "loads the consultation when its shell nears the viewport",
    async () => {
      const observer = holdDeferredIslands();
      render(<DeferredConsultation />);
      await observer.enter();
      expect(
        await screen.findByRole(
          "group",
          {
            name: "What are you weighing up?",
          },
          { timeout: 8000 },
        ),
      ).toBeVisible();
    },
    10_000,
  );

  it("loads a consultation deep link even if layout work moves it off screen", async () => {
    window.history.replaceState({}, "", "/?intent=investing#consultation");
    const observer = holdDeferredIslands();

    render(<DeferredConsultation />);

    expect(await screen.findByRole("textbox", {
      name: "What should I call you?",
    })).toBeVisible();
    expect(observer.observe).not.toHaveBeenCalled();
  });

});
