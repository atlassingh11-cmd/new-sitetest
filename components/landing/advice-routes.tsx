import Image from "next/image";
import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";

const routes = [
  {
    id: "buying",
    title: "Buy",
    body: "A home, an investment or a second opinion before you commit.",
    image: "/media/buy-villa-editorial.webp",
    alt: "Warm contemporary villa interior opening onto a landscaped courtyard",
    options: [
      {
        title: "Find a home to live in",
        detail: "Turn a longlist into a shortlist built around your life.",
        href: "/?intent=buying#consultation",
      },
      {
        title: "Build an investment brief",
        detail: "Test yield, supply, growth and exit before choosing an area.",
        href: "/?intent=investing#consultation",
      },
      {
        title: "Compare off-plan and ready",
        detail: "Put the payment plan, delivery risk and real alternatives side by side.",
        href: "/?intent=buying#consultation",
      },
    ],
  },
  {
    id: "selling",
    title: "Sell",
    body: "A clear route from the first pricing conversation to handover.",
    image: "/media/sell-villa-editorial.webp",
    alt: "Contemporary villa entrance prepared for an evening viewing",
    options: [
      {
        title: "Set the right asking price",
        detail: "Read the live competition and likely buyer demand before launch.",
        href: "/?intent=selling#consultation",
      },
      {
        title: "Prepare the property for market",
        detail: "Choose the positioning, presentation and route to market.",
        href: "/?intent=selling#consultation",
      },
      {
        title: "Negotiate and complete",
        detail: "Assess the offer properly, then manage transfer and handover.",
        href: "/?intent=selling#consultation",
      },
    ],
  },
] as const;

export function AdviceRoutes() {
  return (
    <section id="services" aria-labelledby="advice-routes-heading" className="advice-routes-stage grid bg-[var(--ink)] md:grid-cols-2">
      <h2 id="advice-routes-heading" className="sr-only">
        Advice for buying or selling
      </h2>
      {routes.map((route) => (
        <article
          data-scroll-chapter=""
          id={route.id}
          key={route.title}
          className="group relative isolate flex min-h-[42rem] overflow-hidden bg-[var(--ink)] sm:min-h-[46rem] lg:min-h-[52rem]"
        >
          <Image
            src={route.image}
            alt={route.alt}
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="advice-route-media -z-20 object-cover transition-transform duration-1000 ease-out motion-safe:group-hover:scale-[1.1]"
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(13,18,16,0.08)_0%,rgba(13,18,16,0.72)_40%,rgba(13,18,16,0.98)_68%)]" />
          <div className="mt-auto w-full px-5 pb-8 pt-24 text-[var(--limestone)] sm:px-8 sm:pb-10 lg:px-12 lg:pb-12">
            <h3
              className="max-w-[8ch] font-medium"
              style={{
                fontSize: "clamp(4rem, 7vw, 6.5rem)",
                lineHeight: 0.88,
                letterSpacing: "-0.06em",
              }}
            >
              {route.title}
            </h3>
            <p className="mt-5 max-w-[28rem] text-lg leading-[1.5] text-[color-mix(in_oklch,var(--limestone)_82%,transparent)] sm:text-xl">
              {route.body}
            </p>
            <nav aria-label={`${route.title} advice`} className="mt-7">
              {route.options.map((option) => (
                <a
                  key={option.title}
                  href={option.href}
                  className="group/link grid min-h-[5.5rem] grid-cols-[minmax(0,1fr)_auto] items-center gap-5 border-t border-[color-mix(in_oklch,var(--limestone)_24%,transparent)] py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sea-glass)]"
                >
                  <span>
                    <span className="block text-lg font-medium leading-tight sm:text-xl lg:text-[1.35rem]">
                      {option.title}
                    </span>
                    <span className="mt-1.5 block max-w-[34rem] text-[0.95rem] leading-6 text-[color-mix(in_oklch,var(--limestone)_70%,transparent)]">
                      {option.detail}
                    </span>
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="shrink-0 transition-transform duration-300 ease-out group-hover/link:-translate-y-1 group-hover/link:translate-x-1"
                    size={24}
                    weight="regular"
                  />
                </a>
              ))}
            </nav>
          </div>
        </article>
      ))}
    </section>
  );
}
