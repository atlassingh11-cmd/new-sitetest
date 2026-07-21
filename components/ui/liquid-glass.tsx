"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type LiquidGlassSharedProps = {
  children: React.ReactNode;
  className?: string;
  tone?: "light" | "dark";
};

export type LiquidGlassAnchorProps = LiquidGlassSharedProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className"> & {
    href: string;
  };

export type LiquidGlassButtonProps = LiquidGlassSharedProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className"> & {
    href?: never;
  };

export type LiquidGlassProps =
  | LiquidGlassAnchorProps
  | LiquidGlassButtonProps;

const sharedClasses =
  "group relative isolate inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center overflow-hidden rounded-full px-5 py-3 text-center text-sm font-semibold leading-5 no-underline transition-[transform,box-shadow] duration-500 hover:-translate-y-px active:translate-y-0 active:scale-[0.985] disabled:pointer-events-none disabled:cursor-default disabled:opacity-50 motion-reduce:transform-none motion-reduce:transition-none forced-colors:border forced-colors:border-[ButtonText] forced-colors:bg-[ButtonFace] forced-colors:text-[ButtonText]";

function liquidGlassClasses(
  tone: "light" | "dark",
  className: string | undefined,
) {
  return cn(
    sharedClasses,
    tone === "dark"
      ? "text-[var(--limestone)]"
      : "text-[var(--paper)]",
    className,
  );
}

function glassContainerStyle(
  style: React.CSSProperties | undefined,
): React.CSSProperties {
  return {
    boxShadow:
      "0 9px 24px rgba(2, 10, 9, 0.16), 0 2px 6px rgba(2, 10, 9, 0.1)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };
}

const LiquidGlassBase = React.forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  LiquidGlassProps
>(function LiquidGlass(
  { children, className, tone = "light", ...props },
  ref,
) {
  const filterId = `liquid-glass-${React.useId().replaceAll(":", "")}`;
  const visualLayers = (
    <>
      <svg aria-hidden="true" className="absolute size-0 overflow-hidden">
        <filter
          id={filterId}
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          filterUnits="objectBoundingBox"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.001 0.005"
            numOctaves="1"
            seed="17"
            result="turbulence"
          />
          <feComponentTransfer in="turbulence" result="mapped">
            <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
            <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
            <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
          </feComponentTransfer>
          <feGaussianBlur
            in="turbulence"
            stdDeviation="3"
            result="softMap"
          />
          <feSpecularLighting
            in="softMap"
            surfaceScale="5"
            specularConstant="1"
            specularExponent="100"
            lightingColor="white"
            result="specLight"
          >
            <fePointLight x="-200" y="-200" z="300" />
          </feSpecularLighting>
          <feComposite
            in="specLight"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
            result="litImage"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="softMap"
            scale="200"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit] forced-colors:hidden"
        data-liquid-glass-refraction=""
        style={{
          backdropFilter: "blur(3px) saturate(1.28) contrast(1.06)",
          WebkitBackdropFilter: "blur(3px) saturate(1.28) contrast(1.06)",
          filter: `url(#${filterId})`,
          isolation: "isolate",
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] forced-colors:hidden"
        data-liquid-glass-tint={tone}
        style={{
          background:
            tone === "dark"
              ? "linear-gradient(120deg, rgba(223, 247, 241, 0.07), rgba(9, 31, 27, 0.035) 58%, rgba(255, 255, 255, 0.045))"
              : "linear-gradient(120deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.025) 58%, rgba(193, 236, 225, 0.05))",
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit] forced-colors:hidden"
        data-liquid-glass-specular=""
        style={{
          backgroundImage:
            "linear-gradient(112deg, transparent 28%, rgba(255, 255, 255, 0.18) 41%, rgba(255, 255, 255, 0.04) 48%, transparent 60%)",
          backgroundPosition: "var(--hero-glass-flow, 26%) center",
          backgroundSize: "230% 100%",
          boxShadow:
            "inset 0 1px 0 rgba(255, 255, 255, 0.5)",
          transition:
            "background-position 700ms cubic-bezier(0.175, 0.885, 0.32, 2.2)",
        }}
      />
      <span
        className="relative z-30 inline-flex items-center justify-center gap-2 transition-transform duration-500 group-hover:scale-[0.975] motion-reduce:transform-none motion-reduce:transition-none"
        style={{
          transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
        }}
      >
        {children}
      </span>
    </>
  );

  if ("href" in props && typeof props.href === "string") {
    const anchorProps = props as Omit<
      LiquidGlassAnchorProps,
      keyof LiquidGlassSharedProps
    >;
    const { style, ...restAnchorProps } = anchorProps;
    return (
      <a
        {...restAnchorProps}
        ref={ref as React.ForwardedRef<HTMLAnchorElement>}
        className={liquidGlassClasses(tone, className)}
        data-liquid-glass=""
        style={glassContainerStyle(style)}
      >
        {visualLayers}
      </a>
    );
  }

  const buttonProps = props as Omit<
    LiquidGlassButtonProps,
    keyof LiquidGlassSharedProps
  >;
  const { style, ...restButtonProps } = buttonProps;
  return (
    <button
      {...restButtonProps}
      ref={ref as React.ForwardedRef<HTMLButtonElement>}
      className={liquidGlassClasses(tone, className)}
      data-liquid-glass=""
      style={glassContainerStyle(style)}
      type={restButtonProps.type ?? "button"}
    >
      {visualLayers}
    </button>
  );
});

export const LiquidGlass = LiquidGlassBase as {
  (
    props: LiquidGlassAnchorProps & React.RefAttributes<HTMLAnchorElement>,
  ): React.ReactElement;
  (
    props: LiquidGlassButtonProps & React.RefAttributes<HTMLButtonElement>,
  ): React.ReactElement;
};
