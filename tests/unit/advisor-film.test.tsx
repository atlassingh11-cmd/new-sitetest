import * as React from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdvisorFilm } from "@/components/landing/advisor-film";

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element -- Test double for next/image.
    <img alt={alt} {...props} />
  ),
}));

describe("AdvisorFilm", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("keeps the MP4 detached until Play and guards a pending request", async () => {
    let resolvePlay: (() => void) | undefined;
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockReturnValue(
        new Promise<void>((resolve) => {
          resolvePlay = resolve;
        }),
      );
    const { container } = render(<AdvisorFilm />);
    const video = container.querySelector("video");

    expect(screen.getByText("Meet me in 90 seconds")).toBeVisible();
    expect(video).not.toHaveAttribute("src");
    expect(container.innerHTML).not.toContain("iffy-film.mp4");

    fireEvent.click(
      screen.getByRole("button", { name: "Play the Meet Iffy film" }),
    );

    expect(play).toHaveBeenCalledTimes(1);
    expect(video?.getAttribute("src")).toBe("/media/iffy-film.mp4");
    const pendingButton = screen.getByRole("button", { name: "Film loading" });
    expect(pendingButton).toBeDisabled();
    fireEvent.click(pendingButton);
    expect(play).toHaveBeenCalledTimes(1);

    await act(async () => resolvePlay?.());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Play film" })).toBeEnabled(),
    );
  });

  it("catches initial and retry play failures with live guidance", async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockRejectedValue(new DOMException("Playback blocked", "NotAllowedError"));
    render(<AdvisorFilm />);

    fireEvent.click(
      screen.getByRole("button", { name: "Play the Meet Iffy film" }),
    );
    expect(
      await screen.findByText(
        "The film could not play. Try again.",
      ),
    ).toHaveAttribute("aria-live", "polite");

    fireEvent.click(screen.getByRole("button", { name: "Play film" }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
    expect(screen.getByRole("button", { name: "Play film" })).toBeEnabled();
  });

  it("announces a user-requested pause after playback has started", async () => {
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, "pause")
      .mockImplementation(() => undefined);
    const { container } = render(<AdvisorFilm />);
    const video = container.querySelector("video") as HTMLVideoElement;

    fireEvent.click(
      screen.getByRole("button", { name: "Play the Meet Iffy film" }),
    );
    fireEvent.play(video);
    Object.defineProperty(video, "paused", { configurable: true, value: false });
    fireEvent.click(await screen.findByRole("button", { name: "Pause film" }));

    expect(pause).toHaveBeenCalledOnce();
    expect(screen.getByText("The film is paused.")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });
});
