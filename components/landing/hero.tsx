import { ArrowUpRight, Play } from "@phosphor-icons/react/dist/ssr";

import { HeroMedia } from "@/components/landing/hero-media";
import { LiquidGlass } from "@/components/ui/liquid-glass";

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="hero-scene"
      data-hero-scene=""
      id="top"
    >
      <div className="hero-shell" data-hero-stage="">
        <HeroMedia />

        <div className="hero-copy">
          <div className="hero-copy__inner">
            <div className="hero-copy__message">
              <h1 id="hero-title">
                Advice you can
                <br aria-hidden="true" /> hold me to.
              </h1>
              <p>
                Clear advice for buying or selling in Dubai and Abu Dhabi,
                including when the right move is to wait.
              </p>
            </div>

            <div aria-label="Hero actions" className="hero-actions" role="group">
              <LiquidGlass
                aria-label="Talk to me"
                className="hero-primary-action"
                data-hero-focus="talk"
                href="/?intent=not-sure#consultation"
                tone="dark"
              >
                Talk to me
                <ArrowUpRight aria-hidden="true" size={17} weight="bold" />
              </LiquidGlass>
              <LiquidGlass
                aria-label="Meet me in 90 seconds"
                className="hero-film-action"
                href="#about-iffy"
                tone="light"
              >
                <Play aria-hidden="true" size={16} weight="fill" />
                Meet me in 90 seconds
              </LiquidGlass>
            </div>
          </div>
        </div>

        <div aria-hidden="true" className="hero-scroll-cue">
          <span>Scroll</span>
          <span className="hero-scroll-cue__line" />
        </div>
      </div>
    </section>
  );
}
