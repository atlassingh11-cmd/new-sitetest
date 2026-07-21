"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Pause, Play } from "@phosphor-icons/react";

export function AdvisorFilm() {
  const [activated, setActivated] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [pending, setPending] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState(
    "The film loads only after you choose Play.",
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingRef = useRef(false);
  const playbackErrorRef = useRef(false);

  async function activate() {
    const video = videoRef.current;
    if (!video || pendingRef.current) return;

    pendingRef.current = true;
    playbackErrorRef.current = false;
    setPending(true);

    try {
      if (!activated) {
        setActivated(true);
        setPlaybackStatus("Loading the film.");
        video.src = "/media/iffy-film.mp4";
      }

      if (video.paused) {
        await video.play();
      } else {
        video.pause();
        setPlaying(false);
        setPlaybackStatus("The film is paused.");
      }
    } catch {
      playbackErrorRef.current = true;
      setPlaying(false);
      setPlaybackStatus(
        "The film could not play. Try again.",
      );
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <div className="advisor-film w-full max-w-[28rem]">
      <div className="advisor-film__frame relative aspect-[9/16] w-full overflow-hidden rounded-[1.15rem] bg-[#0a1514] shadow-[0_32px_90px_rgba(14,39,35,0.2)]">
        {!activated ? (
          <Image
            src="/media/iffy-film-poster.webp"
            alt="Iffy Khan speaking with a client on the phone"
            fill
            sizes="(min-width: 1024px) 34vw, 86vw"
            className="object-cover object-center"
          />
        ) : null}
        <video
          ref={videoRef}
          className={`h-full w-full object-cover object-center transition-opacity duration-300 ${activated ? "opacity-100" : "opacity-0"}`}
          preload="none"
          poster="/media/iffy-film-poster.webp"
          playsInline
          controls={activated}
          onError={() => {
            playbackErrorRef.current = true;
            setPlaying(false);
            setPlaybackStatus(
              "The film could not load. Try again.",
            );
          }}
          onPlay={() => {
            playbackErrorRef.current = false;
            setPlaying(true);
            setPlaybackStatus(
              "The film is playing. Native playback controls are available.",
            );
          }}
          onPause={() => {
            setPlaying(false);
            const video = videoRef.current;
            if (
              playbackErrorRef.current ||
              video?.error ||
              (activated && video?.readyState === HTMLMediaElement.HAVE_NOTHING)
            ) {
              playbackErrorRef.current = true;
              setPlaybackStatus(
                "The film could not load. Try again.",
              );
            } else if (!pendingRef.current) {
              setPlaybackStatus("The film is paused.");
            }
          }}
          onEnded={() => {
            setPlaying(false);
            setPlaybackStatus("The film has ended.");
          }}
        >
          <track
            default
            kind="captions"
            src="/media/iffy-film.vtt"
            srcLang="en"
            label="English"
          />
        </video>
        {!activated ? (
          <button
            type="button"
            onClick={activate}
            disabled={pending}
            className="absolute inset-0 flex min-h-11 min-w-11 items-end justify-start bg-[linear-gradient(180deg,transparent_45%,rgba(5,13,12,0.78))] p-5 text-left text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-6px] focus-visible:outline-white sm:p-7"
            aria-label="Play the Meet Iffy film"
          >
            <span className="flex items-center gap-3 text-lg font-semibold tracking-[-0.025em] sm:text-xl">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--paper)] text-[#0a1514] shadow-lg sm:size-14">
                <Play aria-hidden="true" size={19} weight="fill" />
              </span>
              {pending ? "Loading film…" : "Meet me in 90 seconds"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={activate}
            disabled={pending}
            aria-label={pending ? "Film loading" : playing ? "Pause film" : "Play film"}
            className="absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-[#0a1514]/80 text-white backdrop-blur-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-wait disabled:opacity-65"
          >
            {playing ? (
              <Pause aria-hidden="true" size={18} weight="fill" />
            ) : (
              <Play aria-hidden="true" size={18} weight="fill" />
            )}
          </button>
        )}
      </div>
      <p
        aria-live="polite"
        className={
          playbackStatus.includes("could not")
            ? "mt-3 text-sm text-[var(--muted)]"
            : "sr-only"
        }
      >
        {playbackStatus}
      </p>
    </div>
  );
}
