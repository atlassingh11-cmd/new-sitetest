"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { FormPicker } from "./form-picker";

export type AreaGoal = "live" | "invest" | "both";
export type BudgetBand = "b1" | "b2" | "b3" | "b4";
export type AreaLifestyle = "beach" | "city" | "family" | "value";
export type PropertyType = "apt" | "villa" | "any";
export type AreaPriority = "yield" | "growth" | "lifestyle";

export interface AreaAnswers {
  goal: AreaGoal;
  budget: BudgetBand;
  life: AreaLifestyle;
  type: PropertyType;
  prio: AreaPriority;
}

interface AreaProfile {
  scores: Partial<Record<AreaGoal | AreaLifestyle | PropertyType | AreaPriority, number>>;
  minBudget: number;
  fit: string;
  view: string;
}

const AREA_PROFILES: Record<string, AreaProfile> = {
  "Dubai Hills": {
    scores: { live: 3, both: 2, family: 3, villa: 3, apt: 1, growth: 2, lifestyle: 2 },
    minBudget: 2,
    fit: "Families and end-users who want space without leaving the city.",
    view: "Family tenants drive demand here. Buy on school runs and park access, not just the view.",
  },
  "Downtown Dubai": {
    scores: { invest: 2, both: 2, city: 3, apt: 3, growth: 2, yield: 1, lifestyle: 2 },
    minBudget: 2,
    fit: "Buyers who want the global address, and investors in short-let-friendly towers.",
    view: "Downtown trades on recognition. The premium is real, so building quality and service charges decide the return.",
  },
  "Dubai Marina": {
    scores: { invest: 3, both: 2, beach: 2, city: 2, apt: 3, yield: 3, lifestyle: 2 },
    minBudget: 1,
    fit: "Lifestyle buyers and investors wanting an established waterfront address.",
    view: "Two similar towers can perform very differently. The building, the view line and the service charge make the deal.",
  },
  "Business Bay": {
    scores: { invest: 3, city: 2, value: 2, apt: 3, yield: 3, growth: 1 },
    minBudget: 1,
    fit: "Investors and professionals who want Downtown adjacency at a different entry point.",
    view: "Supply is heavy here, so the gap between average and good buildings is wide. Selection matters more than the postcode.",
  },
  "Dubai Islands": {
    scores: { invest: 2, both: 1, beach: 3, apt: 2, villa: 1, growth: 3 },
    minBudget: 2,
    fit: "Early-cycle investors comfortable with a longer horizon.",
    view: "A patience play. Payment plan, developer track record and handover timeline matter more than the render.",
  },
  "Palm Jumeirah": {
    scores: { live: 2, both: 2, beach: 3, villa: 2, apt: 2, lifestyle: 3, growth: 2 },
    minBudget: 3,
    fit: "Trophy buyers and long-term holders.",
    view: "The Palm is about scarcity. Buy the best line you can afford and think in years, not cycles.",
  },
  Dubailand: {
    scores: { live: 3, family: 3, value: 3, villa: 3, growth: 2, yield: 1 },
    minBudget: 1,
    fit: "Families and value-focused end-users.",
    view: "Judge each community on delivery. Roads, schools and retail arriving on time change everything here.",
  },
  "Saadiyat, AD": {
    scores: { live: 2, both: 1, beach: 2, family: 1, villa: 2, apt: 1, lifestyle: 3, growth: 2 },
    minBudget: 3,
    fit: "End-users and investors who want Abu Dhabi's cultural address.",
    view: "Saadiyat is a different market to Dubai: quieter, supply-controlled and end-user led. Plan accordingly.",
  },
};

const BUDGET_RANK: Record<BudgetBand, number> = { b1: 1, b2: 2, b3: 3, b4: 4 };

export interface AreaRecommendation {
  name: string;
  points: number;
  fit: string;
  view: string;
}

export function recommendAreas(answers: AreaAnswers): AreaRecommendation[] {
  const budget = BUDGET_RANK[answers.budget];
  return Object.entries(AREA_PROFILES)
    .map(([name, profile]) => {
      let points = [answers.goal, answers.life, answers.type, answers.prio].reduce(
        (sum, answer) => sum + (profile.scores[answer] ?? 0),
        0,
      );
      if (answers.type === "any") {
        points += Math.max(profile.scores.apt ?? 0, profile.scores.villa ?? 0);
      }
      if (budget < profile.minBudget) {
        points -= profile.minBudget - budget >= 2 ? 99 : 4;
      } else if (budget === profile.minBudget) {
        points += 1;
      }
      return { name, points, fit: profile.fit, view: profile.view };
    })
    .sort((a, b) => b.points - a.points)
    .filter((area) => area.points > -50)
    .slice(0, 3);
}

const QUESTIONS = [
  { name: "goal", legend: "Are you buying to live or invest?", options: [["live", "To live"], ["invest", "To invest"], ["both", "Both"]] },
  { name: "budget", legend: "Your budget", options: [["b1", "Under AED 1.5M"], ["b2", "AED 1.5M to 3M"], ["b3", "AED 3M to 6M"], ["b4", "AED 6M+"]] },
  { name: "life", legend: "Lifestyle", options: [["beach", "Beach and waterfront"], ["city", "City energy"], ["family", "Family and green space"], ["value", "Quiet value"]] },
  { name: "type", legend: "Property type", options: [["apt", "Apartment"], ["villa", "Villa or townhouse"], ["any", "Open to either"]] },
  { name: "prio", legend: "What matters most?", options: [["yield", "Rental yield"], ["growth", "Capital growth"], ["lifestyle", "Lifestyle first"]] },
] as const;

export function AreaFinder() {
  const [answers, setAnswers] = useState<Partial<AreaAnswers>>({});
  const [results, setResults] = useState<AreaRecommendation[] | null>(null);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Object.keys(answers).length !== QUESTIONS.length) {
      setError("Please answer all five questions first.");
      return;
    }
    setError("");
    setResults(recommendAreas(answers as AreaAnswers));
  }

  return (
    <div>
      <FormPicker
        actionLabel="Show where to start"
        answers={answers}
        error={error}
        onAnswer={(name, value) => {
          setAnswers((current) => ({ ...current, [name]: value }));
          setResults(null);
          setError("");
        }}
        onSubmit={submit}
        questions={QUESTIONS}
      />

      {results ? (
        <section
          aria-live="polite"
          className="mt-14 bg-[var(--ink)] px-6 py-10 text-[var(--limestone)] sm:px-10 sm:py-12"
        >
          <h3 className="max-w-2xl text-3xl font-medium tracking-[-0.035em] sm:text-4xl">
            Where I would start
          </h3>
          <ol className="mt-8 border-t border-[color-mix(in_oklch,var(--limestone)_22%,transparent)]">
            {results.map((area, index) => (
              <li
                className="grid gap-3 border-b border-[color-mix(in_oklch,var(--limestone)_22%,transparent)] py-7 sm:grid-cols-[3rem_minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-6"
                key={area.name}
              >
                <span className="text-sm tabular-nums text-[var(--sea-glass)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h4 className="text-xl font-medium">{area.name}</h4>
                  <p className="mt-2 leading-7 text-[var(--limestone-deep)]">
                    {area.fit}
                  </p>
                </div>
                <p className="leading-7 text-[var(--limestone-deep)]">
                  {area.view}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--limestone-deep)]">
            This is a first pass. Service charges, build quality, exact stock and
            exit demand can change the recommendation.
          </p>
          <Link
            className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[var(--sea-glass)] px-6 py-3 text-base font-medium text-[var(--ink)] transition-colors hover:bg-[var(--limestone)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sea-glass)]"
            href="/?intent=buying#consultation"
          >
            Discuss the shortlist with Iffy
          </Link>
        </section>
      ) : null}
    </div>
  );
}
