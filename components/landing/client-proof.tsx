import * as React from "react";

import { testimonials } from "@/content/site";

const featuredReview = testimonials[1];
const QUOTE = `“${featuredReview.featuredExcerpt}”`;
const QUOTE_WORDS = QUOTE.split(" ");

export function ClientProof() {
  return (
    <section
      className="client-proof-stage bg-[var(--surface-soft)] px-4 pb-20 pt-8 sm:px-6 sm:pb-28 sm:pt-20 lg:px-10"
      data-highlighted-words={QUOTE_WORDS.length}
      data-quote-chapter=""
      id="testimonials"
    >
      <figure className="client-proof-layout mx-auto max-w-5xl">
        <h2 className="mb-8 text-xl font-semibold tracking-[-0.025em] text-[var(--ink)] sm:text-2xl">
          Straight answers. No pressure.
        </h2>
        <blockquote className="text-4xl font-medium leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
          {QUOTE_WORDS.map((word, index) => (
            <React.Fragment key={`${word}-${index}`}>
              <span
                className="transition-colors duration-200 ease-[var(--ease-out-quint)]"
                data-quote-word=""
              >
                {word}
              </span>
              {index < QUOTE_WORDS.length - 1 ? " " : null}
            </React.Fragment>
          ))}
        </blockquote>
        <figcaption className="mt-8 text-sm font-semibold text-[var(--muted)] sm:text-base">
          {featuredReview.attribution}
        </figcaption>
      </figure>
    </section>
  );
}
