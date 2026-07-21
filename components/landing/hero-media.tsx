"use client";

import Image from "next/image";
import * as React from "react";

type NavigatorWithConnection = Navigator & {
  connection?: {
    saveData?: boolean;
  };
};

export function HeroMedia() {
  const [videoEnabled, setVideoEnabled] = React.useState(false);
  const [videoReady, setVideoReady] = React.useState(false);

  React.useEffect(() => {
    const reducedMotionQuery = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    );
    const saveData = (navigator as NavigatorWithConnection).connection
      ?.saveData;
    let timer = 0;

    const syncVideoPreference = () => {
      window.clearTimeout(timer);
      if (reducedMotionQuery?.matches || saveData) {
        setVideoEnabled(false);
        setVideoReady(false);
        return;
      }

      timer = window.setTimeout(() => setVideoEnabled(true), 450);
    };

    syncVideoPreference();
    reducedMotionQuery?.addEventListener("change", syncVideoPreference);

    return () => {
      window.clearTimeout(timer);
      reducedMotionQuery?.removeEventListener("change", syncVideoPreference);
    };
  }, []);

  return (
    <div
      className="hero-media"
      data-hero-media=""
      data-hero-parallax=""
    >
      <Image
        alt="Iffy Khan smiling while speaking with a client"
        className="hero-media__asset"
        fill
        priority
        sizes="100vw"
        src="/media/iffy-hero-poster.webp"
      />

      {videoEnabled ? (
        <video
          aria-hidden="true"
          autoPlay
          className={`hero-media__asset hero-media__video ${
            videoReady ? "is-ready" : ""
          }`}
          loop
          muted
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoEnabled(false)}
          playsInline
          poster="/media/iffy-hero-poster.webp"
          preload="metadata"
          src="/media/iffy-hero.mp4"
          tabIndex={-1}
        />
      ) : null}

      <span aria-hidden="true" className="hero-media__light" />
    </div>
  );
}
