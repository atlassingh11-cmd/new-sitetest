"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { FormPicker } from "./form-picker";

export interface OffPlanAnswers {
  when: "now" | "soon" | "flex";
  income: "yes" | "no";
  pay: "staged" | "once";
  risk: "low" | "high";
  appeal: "new" | "est";
}

export interface OffPlanResult {
  verdict: "balanced" | "offplan" | "ready";
  heading: string;
  detail: string;
  reasons: string[];
  offPlanScore: number;
  readyScore: number;
}

export function checkOffPlanSuitability(answers: OffPlanAnswers): OffPlanResult {
  let offPlanScore = 0;
  let readyScore = 0;
  const reasons: string[] = [];
  if (answers.when === "now") { readyScore += 2; reasons.push("You need the property now, which only ready stock can deliver."); }
  if (answers.when === "soon") readyScore += 1;
  if (answers.when === "flex") { offPlanScore += 2; reasons.push("A flexible timeline lets you benefit from construction-phase pricing."); }
  if (answers.income === "yes") { readyScore += 2; reasons.push("Immediate rental income requires a completed, tenantable unit."); }
  if (answers.income === "no") offPlanScore += 1;
  if (answers.pay === "staged") { offPlanScore += 2; reasons.push("Developer payment plans spread cost through construction."); }
  if (answers.pay === "once") readyScore += 1;
  if (answers.risk === "low") { readyScore += 2; reasons.push("You value the certainty of inspecting a finished property."); }
  if (answers.risk === "high") { offPlanScore += 2; reasons.push("You are comfortable trading construction risk for launch pricing."); }
  if (answers.appeal === "new") offPlanScore += 1;
  if (answers.appeal === "est") readyScore += 1;
  if (Math.abs(offPlanScore - readyScore) <= 1) return {
    verdict: "balanced", heading: "It’s genuinely balanced", offPlanScore, readyScore, reasons,
    detail: "Your answers point both ways, which usually means the right choice depends on the specific project and community. Worth comparing one of each with Iffy.",
  };
  if (offPlanScore > readyScore) return {
    verdict: "offplan", heading: "Off-plan looks like the better fit", offPlanScore, readyScore, reasons,
    detail: "Based on your answers, off-plan’s staged payments and launch pricing align with your situation. Developer selection then becomes the critical decision.",
  };
  return {
    verdict: "ready", heading: "Ready property looks like the better fit", offPlanScore, readyScore, reasons,
    detail: "Based on your answers, a completed property matches your timeline and income needs. The focus becomes finding value in the secondary market.",
  };
}

const QUESTIONS = [
  { name: "when", legend: "When do you need the property?", options: [["now", "Ready to move or rent now"], ["soon", "Within 12 months"], ["flex", "2+ years, flexible"]] },
  { name: "income", legend: "Do you need rental income immediately?", options: [["yes", "Yes"], ["no", "No"]] },
  { name: "pay", legend: "How do you prefer to pay?", options: [["staged", "Staged payments over time"], ["once", "One complete purchase"]] },
  { name: "risk", legend: "Your comfort with construction-phase risk?", options: [["low", "Prefer a finished product"], ["high", "Comfortable, for the upside"]] },
  { name: "appeal", legend: "What appeals more?", options: [["new", "Newest product at launch pricing"], ["est", "Established community, see what you buy"]] },
] as const;

export function OffPlanCheck() {
  const [answers, setAnswers] = useState<Partial<OffPlanAnswers>>({});
  const [result, setResult] = useState<OffPlanResult | null>(null);
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Object.keys(answers).length !== QUESTIONS.length) { setError("Please answer all five questions first."); return; }
    setError(""); setResult(checkOffPlanSuitability(answers as OffPlanAnswers));
  }
  return (
    <div>
      <FormPicker
        actionLabel="Compare the routes"
        answers={answers}
        error={error}
        onAnswer={(name, value) => {
          setAnswers((current) => ({ ...current, [name]: value }));
          setResult(null);
          setError("");
        }}
        onSubmit={submit}
        questions={QUESTIONS}
      />

      {result ? (
        <section
          aria-live="polite"
          className="mt-14 bg-[var(--ink)] px-6 py-10 text-[var(--limestone)] sm:px-10 sm:py-12"
        >
          <h3 className="max-w-2xl text-3xl font-medium tracking-[-0.035em] sm:text-4xl">
            {result.heading}
          </h3>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--limestone-deep)]">
            {result.detail}
          </p>
          {result.reasons.length ? (
            <ul className="mt-8 border-t border-[color-mix(in_oklch,var(--limestone)_22%,transparent)]">
              {result.reasons.slice(0, 3).map((reason) => (
                <li
                  className="border-b border-[color-mix(in_oklch,var(--limestone)_22%,transparent)] py-5 text-base leading-7 text-[var(--limestone-deep)]"
                  key={reason}
                >
                  {reason}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--limestone-deep)]">
            This is a guide, not advice. Both routes need project-level due
            diligence before you act.
          </p>
          <Link
            className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[var(--sea-glass)] px-6 py-3 text-base font-medium text-[var(--ink)] transition-colors hover:bg-[var(--limestone)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sea-glass)]"
            href="/?intent=investing#consultation"
          >
            Ask Iffy to compare the options
          </Link>
        </section>
      ) : null}
    </div>
  );
}
