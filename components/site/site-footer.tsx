/* eslint-disable @next/next/no-html-link-for-pages -- Native navigation is intentional for the static export and its strict entry-JS budget. */

import Image from "next/image";

import { navigation, site } from "@/content/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <a
          className="site-footer__cta"
          href="/?intent=not-sure#consultation"
        >
          <span>Talk to me</span>
          <span aria-hidden="true">↗</span>
        </a>

        <div className="site-footer__body">
          <a
            aria-label="Iffy Khan footer home"
            className="site-footer__brand"
            href="/#top"
          >
            <Image
              alt=""
              aria-hidden="true"
              height={44}
              src="/media/ik-logo.png"
              width={48}
            />
            <span>
              {site.role}
              <small>{site.region}</small>
            </span>
          </a>

          <nav className="site-footer__links" aria-label="Footer navigation">
            {navigation.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ))}
            <a href="/privacy">Privacy</a>
          </nav>

          <address className="site-footer__contact">
            <a href={`tel:${site.phoneE164}`}>{site.phoneDisplay}</a>
            <a
              href={`https://wa.me/${site.whatsappNumber}`}
              rel="noreferrer"
              target="_blank"
            >
              WhatsApp
            </a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <a href={site.mapUrl} target="_blank" rel="noreferrer">
              {site.office}
            </a>
            <a href={site.instagram} target="_blank" rel="noreferrer">
              {site.instagramHandle}
            </a>
          </address>
        </div>

        <div className="site-footer__legal">
          <span>© 2026 {site.name}</span>
          <span>
            Licence {site.licence} · {site.agency} ORN {site.orn}
          </span>
          <span>{site.disclaimer}</span>
          <span>
            Built by{" "}
            <a href={site.designerUrl} target="_blank" rel="noreferrer">
              Local Foundary
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
