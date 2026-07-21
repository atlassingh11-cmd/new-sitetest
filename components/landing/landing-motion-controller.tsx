"use client";

import * as React from "react";
import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "motion/react";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

function viewportProgress(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  return clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height));
}

function setNumber(element: HTMLElement, name: string, value: number) {
  element.style.setProperty(name, value.toFixed(4));
}

function clearPaintedStyles() {
  document
    .querySelectorAll<HTMLElement>("[data-quote-word]")
    .forEach((word) => word.style.removeProperty("color"));

  const hero = document.querySelector<HTMLElement>("[data-hero-scene]");
  [
    "--hero-progress",
    "--hero-media-x",
    "--hero-media-y",
    "--hero-media-scale",
    "--hero-copy-y",
    "--hero-copy-scale",
    "--hero-copy-opacity",
    "--hero-actions-y",
    "--hero-actions-opacity",
    "--hero-glass-flow",
    "--hero-cue-opacity",
  ].forEach((property) => hero?.style.removeProperty(property));
}

function paintPage() {
  const hero = document.querySelector<HTMLElement>("[data-hero-scene]");
  if (hero) {
    const stage = hero.querySelector<HTMLElement>("[data-hero-stage]");
    const headerOffset = 64;
    const range = Math.max(1, hero.offsetHeight - (stage?.offsetHeight ?? window.innerHeight));
    const progress = clamp((headerOffset - hero.getBoundingClientRect().top) / range);
    const messageExit = clamp((progress - 0.22) / 0.28);
    const actionsExit = clamp((progress - 0.52) / 0.2);

    setNumber(hero, "--hero-progress", progress);
    hero.style.setProperty("--hero-media-x", `${-8 * progress}%`);
    hero.style.setProperty("--hero-media-y", `${-4 + progress * 15}%`);
    hero.style.setProperty("--hero-media-scale", `${1.025 + progress * 0.135}`);
    hero.style.setProperty("--hero-copy-y", `${-11 * messageExit}vh`);
    hero.style.setProperty("--hero-copy-scale", `${1 - messageExit * 0.035}`);
    hero.style.setProperty(
      "--hero-copy-opacity",
      `${Math.max(0, 1 - messageExit * 1.18)}`,
    );
    hero.style.setProperty("--hero-actions-y", `${-4 * actionsExit}vh`);
    hero.style.setProperty(
      "--hero-actions-opacity",
      `${Math.max(0, 1 - actionsExit * 1.18)}`,
    );
    hero.style.setProperty("--hero-glass-flow", `${12 + progress * 76}%`);
    hero.style.setProperty("--hero-cue-opacity", `${1 - clamp(progress / 0.28)}`);
  }

  document
    .querySelectorAll<HTMLElement>("[data-scroll-chapter]")
    .forEach((chapter) => {
      const progress = viewportProgress(chapter);
      const entry = clamp(progress / 0.43);
      setNumber(chapter, "--chapter-progress", progress);
      setNumber(chapter, "--chapter-entry", entry);
      chapter.style.setProperty("--chapter-media-y", `${(progress - 0.5) * 18}%`);
      chapter.style.setProperty("--chapter-copy-y", `${(0.48 - progress) * 4.5}rem`);
      chapter.style.setProperty("--chapter-media-scale", `${1.115 - progress * 0.075}`);
      chapter.style.setProperty("--chapter-entry-y", `${(1 - entry) * 3.5}rem`);
      chapter.style.setProperty("--chapter-radius", `${(1 - entry) * 2.25}rem`);
      chapter.style.setProperty("--chapter-clip-top", `${(1 - entry) * 6}%`);
      chapter.style.setProperty("--chapter-opacity", `${0.68 + entry * 0.32}`);
    });

  document
    .querySelectorAll<HTMLElement>("[data-quote-chapter]")
    .forEach((section) => {
      const progress = viewportProgress(section);
      const words = Array.from(
        section.querySelectorAll<HTMLElement>("[data-quote-word]"),
      );
      const quotePace = window.innerWidth < 768 ? 1.75 : 1.38;
      const visibleCount = Math.floor(progress * quotePace * words.length);
      words.forEach((word, index) => {
        word.style.color =
          index < visibleCount
            ? "var(--ink)"
            : "color-mix(in oklch, var(--ink) 60%, var(--surface-soft))";
      });
      section.dataset.highlightedWords = String(Math.min(words.length, visibleCount));
    });
}

export function LandingMotionController() {
  const reducedMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const easedScroll = useSpring(scrollY, {
    stiffness: 180,
    damping: 34,
    mass: 0.28,
    restDelta: 0.25,
  });

  useMotionValueEvent(easedScroll, "change", () => {
    if (!reducedMotion) paintPage();
  });

  React.useEffect(() => {
    const root = document.documentElement;

    if (reducedMotion) {
      root.dataset.scrollMotion = "reduced";
      clearPaintedStyles();
      return () => {
        delete root.dataset.scrollMotion;
      };
    }

    root.dataset.scrollMotion = "active";
    const frame = window.requestAnimationFrame(paintPage);
    window.addEventListener("resize", paintPage);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", paintPage);
      delete root.dataset.scrollMotion;
    };
  }, [reducedMotion]);

  return null;
}
