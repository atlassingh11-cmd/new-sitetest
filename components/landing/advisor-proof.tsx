import { AdvisorFilm } from "./advisor-film";

const HEADING =
  "The recommendation has to be right, even when it costs a sale.";
const STORY_ONE =
  "Iffy moved from retail banking into property after six years investing in the UK. He now advises across Dubai and Abu Dhabi.";
const STORY_TWO =
  "The work is personal: understand the objective, challenge weak assumptions and stay accountable through completion.";

export function AdvisorProof() {
  return (
    <section
      data-scroll-chapter=""
      id="about-iffy"
      className="advisor-proof-stage bg-[var(--surface)] px-4 pb-16 pt-0 sm:px-6 sm:pb-20 sm:pt-16 lg:px-10 lg:pb-24 lg:pt-24"
    >
      <div className="advisor-proof-layout mx-auto grid max-w-[82rem] items-center gap-14 sm:gap-20 lg:grid-cols-[minmax(24rem,0.82fr)_minmax(0,1fr)] lg:gap-[clamp(4rem,8vw,8rem)]">
        <div className="advisor-proof-media mx-auto w-full max-w-[28rem] lg:mx-0">
          <AdvisorFilm />
        </div>

        <div className="advisor-proof-copy max-w-[42rem] lg:py-12">
          <h2 className="max-w-[11ch] text-[clamp(3rem,5.8vw,6.25rem)] font-medium leading-[0.94] tracking-[-0.058em] text-[var(--ink)]">
            {HEADING}
          </h2>

          <div className="mt-10 max-w-[38rem] space-y-7 text-lg leading-[1.65] text-[var(--ink)] sm:mt-12 sm:text-xl">
            <p>{STORY_ONE}</p>
            <p>{STORY_TWO}</p>
          </div>

          <a
            href="/about"
            className="mt-10 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--ink)] underline decoration-[var(--accent)] underline-offset-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent-strong)]"
          >
            Read Iffy&apos;s story
          </a>
        </div>
      </div>
    </section>
  );
}
