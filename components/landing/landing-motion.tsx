"use client";

import dynamic from "next/dynamic";

const LandingMotionController = dynamic(
  () =>
    import("@/components/landing/landing-motion-controller").then(
      (module) => module.LandingMotionController,
    ),
  { ssr: false },
);

export function LandingMotion() {
  return <LandingMotionController />;
}
