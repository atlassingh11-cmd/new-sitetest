"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Native navigation is intentional for the static export and its strict entry-JS budget. */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, List, X } from "@phosphor-icons/react";

import { navigation } from "@/content/site";

const primaryNavigation = [
  { label: "Buy", href: "/?intent=buying#buying" },
  { label: "Sell", href: "/?intent=selling#selling" },
  { label: "About", href: "/about" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const brandRef = useRef<HTMLAnchorElement>(null);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) {
      document.body.style.removeProperty("overflow");
      return;
    }

    document.body.style.overflow = "hidden";
    const firstLink = menuRef.current?.querySelector<HTMLAnchorElement>("a");
    firstLink?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !menuRef.current) return;
      const controls = Array.from(
        menuRef.current.querySelectorAll<HTMLAnchorElement>("a"),
      );
      const first = controls[0];
      const last = controls.at(-1);
      const trigger = triggerRef.current;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        trigger?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        trigger?.focus();
      } else if (event.shiftKey && document.activeElement === trigger) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === trigger) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const desktop = window.matchMedia("(min-width: 62.001rem)");
    const onBreakpointChange = (event: MediaQueryListEvent) => {
      if (!event.matches) return;
      setOpen(false);
      brandRef.current?.focus();
    };
    desktop.addEventListener("change", onBreakpointChange);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onBreakpointChange);
      document.body.style.removeProperty("overflow");
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a ref={brandRef} className="site-monogram" href="/#top" aria-label="Iffy Khan home">
          <Image
            aria-hidden="true"
            alt=""
            className="site-monogram__image"
            height={31}
            priority
            src="/media/ik-logo.png"
            style={{ width: 34, height: "auto", filter: "invert(1)" }}
            width={34}
          />
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {primaryNavigation.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="header-action" href="/?intent=not-sure#consultation">
          Talk to me
          <ArrowUpRight aria-hidden="true" size={16} weight="bold" />
        </a>

        <button
          ref={triggerRef}
          className="menu-trigger"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close navigation" : "Open navigation"}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? (
            <X aria-hidden="true" size={23} weight="regular" />
          ) : (
            <List aria-hidden="true" size={23} weight="regular" />
          )}
        </button>
      </div>

      {open ? (
        <nav
          ref={menuRef}
          id="mobile-navigation"
          className="mobile-nav"
          aria-label="Mobile navigation"
        >
          <div className="mobile-nav__primary">
            {primaryNavigation.map((item) => (
              <a key={item.label} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ))}
          </div>
          <a
            className="mobile-nav__action"
            href="/?intent=not-sure#consultation"
            onClick={() => setOpen(false)}
          >
            Talk to me
            <ArrowUpRight aria-hidden="true" size={21} weight="bold" />
          </a>
        </nav>
      ) : null}
      <noscript>
        <nav className="no-script-nav" aria-label="Navigation without JavaScript">
          {navigation.map((item) => (
            <a key={item.label} href={item.href}>
              {item.label}
            </a>
          ))}
          <a href="/?intent=not-sure#consultation">Talk to me</a>
        </nav>
      </noscript>
    </header>
  );
}
