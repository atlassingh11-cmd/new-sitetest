"use client";

import Image from "next/image";

import {
  type ComponentType,
  type MutableRefObject,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

import { contact } from "@/content/contact";

type EmptyProps = Record<string, never>;
type DeferredLoader<Props extends object> = () => Promise<
  ComponentType<Props>
>;

const loadConsultation: DeferredLoader<EmptyProps> = () =>
  import("@/components/landing/consultation").then(
    (module) => module.Consultation,
  );

function useNearViewport<Props extends object>(
  loader: DeferredLoader<Props>,
  targetId?: string,
): [
  MutableRefObject<HTMLDivElement | null>,
  ComponentType<Props> | null,
] {
  const hostRef = useRef<HTMLDivElement>(null);
  const [LoadedComponent, setLoadedComponent] =
    useState<ComponentType<Props> | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || LoadedComponent) return;

    let active = true;
    let loading = false;
    let retryTimer = 0;

    const load = () => {
      if (loading) return;
      loading = true;
      void loader()
        .then((component) => {
          if (active) setLoadedComponent(() => component);
        })
        .catch(() => {
          loading = false;
          if (active && retryCount < 1) {
            retryTimer = window.setTimeout(
              () => setRetryCount((current) => current + 1),
              750,
            );
          }
        });
    };

    if (targetId && window.location.hash === `#${targetId}`) {
      load();
      return () => {
        active = false;
        window.clearTimeout(retryTimer);
      };
    }

    if (typeof IntersectionObserver !== "function") {
      load();
      return () => {
        active = false;
        window.clearTimeout(retryTimer);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        load();
      },
      { rootMargin: "800px 0px" },
    );

    observer.observe(host);
    return () => {
      active = false;
      window.clearTimeout(retryTimer);
      observer.disconnect();
    };
  }, [LoadedComponent, loader, retryCount, targetId]);

  useEffect(() => {
    if (!LoadedComponent || !targetId || window.location.hash !== `#${targetId}`) {
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) return;

    let active = true;
    let frame = 0;
    let observer: ResizeObserver | null = null;

    const alignTarget = () => {
      if (!active) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const scrollMargin = Number.parseFloat(
          window.getComputedStyle(target).scrollMarginTop,
        ) || 0;
        const top = Math.max(
          0,
          window.scrollY + target.getBoundingClientRect().top - scrollMargin,
        );
        const root = document.documentElement;
        const previousBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        window.scrollTo({ left: window.scrollX, top, behavior: "auto" });
        root.style.scrollBehavior = previousBehavior;
      });
    };

    const stopObserving = () => {
      active = false;
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
    };

    alignTarget();

    if (typeof ResizeObserver === "function") {
      observer = new ResizeObserver(alignTarget);
      observer.observe(document.body);
    }

    const settleTimer = window.setTimeout(stopObserving, 1600);
    const userEvents: Array<keyof WindowEventMap> = [
      "keydown",
      "touchstart",
      "wheel",
    ];
    userEvents.forEach((eventName) =>
      window.addEventListener(eventName, stopObserving, {
        once: true,
        passive: true,
      }),
    );

    return () => {
      window.clearTimeout(settleTimer);
      userEvents.forEach((eventName) =>
        window.removeEventListener(eventName, stopObserving),
      );
      stopObserving();
    };
  }, [LoadedComponent, targetId]);

  return [hostRef, LoadedComponent];
}

function DeferredHost({
  children,
  className,
  hostRef,
  name,
}: {
  children: ReactNode;
  className?: string;
  hostRef: MutableRefObject<HTMLDivElement | null>;
  name: string;
}) {
  return (
    <div className={className} ref={hostRef} data-deferred-island={name}>
      {children}
    </div>
  );
}

function ConsultationShell() {
  const intentLinks = [
    ["Buying", "buying"],
    ["Selling", "selling"],
    ["Investing", "investing"],
    ["Not sure yet", "not-sure"],
  ] as const;

  return (
    <section
      id="consultation"
      aria-labelledby="deferred-consultation-heading"
      className="consultation-atmosphere consultation-stage text-[var(--ink)]"
    >
      <div className="consultation-layout">
        <div className="consultation-content">
          <h2
            id="deferred-consultation-heading"
            className="max-w-[11ch] text-balance text-[clamp(3.25rem,6vw,5.6rem)] font-medium leading-[0.92] tracking-[-0.06em]"
          >
            Tell me what you&apos;re weighing up.
          </h2>
          <p className="mt-6 max-w-[36rem] text-lg leading-8 text-[var(--ink-soft)]">
            Three quick choices. I&apos;ll reply personally.
          </p>
          <div className="mt-10 flex items-center gap-3 text-sm font-semibold text-[var(--muted)]">
            <span>1 / 3</span>
            <span className="h-px flex-1 bg-[color-mix(in_oklch,var(--ink)_18%,transparent)]" />
          </div>
          <h3 className="mt-3 text-[clamp(1.65rem,3vw,2.4rem)] font-medium leading-tight tracking-[-0.04em]">
            What are you weighing up?
          </h3>
          <nav
            aria-label="Choose what you are weighing up"
            className="mt-7 grid sm:grid-cols-2"
          >
            {intentLinks.map(([label, value]) => (
              <a
                className="group flex min-h-20 items-center justify-between gap-5 border-b border-[color-mix(in_oklch,var(--ink)_18%,transparent)] py-4 text-xl font-medium sm:odd:mr-5 sm:even:ml-5"
                href={`/?intent=${value}#consultation`}
                key={value}
              >
                {label}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
            ))}
          </nav>
          <div className="mt-10 hidden flex-wrap gap-x-6 gap-y-3 text-sm leading-7 text-[var(--ink-soft)] sm:flex">
            <a
              className="min-h-11 py-2 underline decoration-[var(--sea-glass)] decoration-2 underline-offset-4 hover:text-[var(--ink)]"
              href={`https://wa.me/${contact.whatsappNumber}`}
            >
              WhatsApp {contact.phoneDisplay}
            </a>
            <a
              className="min-h-11 py-2 underline decoration-[var(--sea-glass)] decoration-2 underline-offset-4 hover:text-[var(--ink)]"
              href={`mailto:${contact.email}`}
            >
              {contact.email}
            </a>
            <a
              className="min-h-11 py-2 underline decoration-[var(--sea-glass)] decoration-2 underline-offset-4 hover:text-[var(--ink)]"
              href={`tel:${contact.phoneE164}`}
            >
              Call {contact.phoneDisplay}
            </a>
          </div>
        </div>
        <div className="consultation-media" data-calendar-open="false">
          <Image
            alt="Iffy Khan reviewing a property brief"
            className="consultation-media__asset consultation-media__person"
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 48vw, 100vw"
            src="/media/iffy-laptop.webp"
          />
          <div className="consultation-media__shade" />
        </div>
      </div>
    </section>
  );
}

export function DeferredConsultation() {
  const [hostRef, LoadedComponent] = useNearViewport(
    loadConsultation,
    "consultation",
  );

  return (
    <DeferredHost
      className="consultation-reveal-layer"
      hostRef={hostRef}
      name="consultation"
    >
      {LoadedComponent ? <LoadedComponent /> : <ConsultationShell />}
    </DeferredHost>
  );
}
