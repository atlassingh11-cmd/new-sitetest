"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export type PurchaseType = "ready" | "offplan";
export type FundingType = "mortgage" | "cash";
export type PurchasePurpose = "first" | "invest";
export type InitialPayment = 10 | 20 | 30;

export interface BudgetInput {
  price: number;
  type: PurchaseType;
  funding?: FundingType;
  purpose?: PurchasePurpose;
  initialPayment?: InitialPayment;
}

export interface BudgetRow { label: string; amount: number }
export interface BudgetResult { heading: string; rows: BudgetRow[]; total: number }

export function calculateBuyingCosts(input: BudgetInput): BudgetResult {
  if (!Number.isFinite(input.price) || input.price < 100_000) {
    throw new RangeError("Property price must be at least AED 100,000.");
  }
  const rows: BudgetRow[] = [];
  const add = (label: string, amount: number) => rows.push({ label, amount });
  let heading = "";
  if (input.type === "ready") {
    add("DLD transfer fee (4% + AED 580)", input.price * 0.04 + 580);
    add("Trustee office fee", input.price >= 500_000 ? 4_200 : 2_100);
    add("Agency fee (2% + VAT)", input.price * 0.021);
    if ((input.funding ?? "mortgage") === "mortgage") {
      const downPaymentRate = input.purpose === "invest" ? 0.4 : input.price >= 5_000_000 ? 0.3 : 0.2;
      const downPayment = input.price * downPaymentRate;
      const loan = input.price - downPayment;
      heading = `With a mortgage (${downPaymentRate * 100}% down payment)`;
      add(`Down payment (${downPaymentRate * 100}%)`, downPayment);
      add("Mortgage registration (0.25% of loan + AED 290)", loan * 0.0025 + 290);
      add("Bank arrangement fee (approx. 1% of loan)", loan * 0.01);
      add("Valuation fee (approx.)", 3_150);
    } else {
      heading = "Cash purchase";
      add("Property price", input.price);
    }
  } else {
    const initialPayment = input.initialPayment ?? 20;
    heading = `Off-plan, ${initialPayment}% initial payment`;
    add(`Initial payment (${initialPayment}% of price)`, input.price * (initialPayment / 100));
    add("DLD fee (4%)", input.price * 0.04);
    add("Registration admin (approx.)", 1_100);
  }
  return { heading, rows, total: rows.reduce((sum, row) => sum + row.amount, 0) };
}

const formatAED = (value: number) => `AED ${Math.round(value).toLocaleString("en-US")}`;

export function BudgetCalculator() {
  const [type, setType] = useState<PurchaseType>("ready");
  const [funding, setFunding] = useState<FundingType>("mortgage");
  const [purpose, setPurpose] = useState<PurchasePurpose>("first");
  const [initialPayment, setInitialPayment] = useState<InitialPayment>(20);
  const [price, setPrice] = useState("");
  const [result, setResult] = useState<BudgetResult | null>(null);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setResult(calculateBuyingCosts({ price: Number(price), type, funding, purpose, initialPayment }));
      setError("");
    } catch {
      setResult(null);
      setError("Enter a property price of at least AED 100,000.");
    }
  }

  const fieldClass =
    "mt-3 min-h-14 w-full border-b border-[color-mix(in_oklch,var(--ink)_28%,transparent)] bg-transparent py-3 text-lg text-[var(--ink)] outline-none transition-colors focus-visible:border-[var(--gulf)] focus-visible:ring-0";

  return (
    <form className="max-w-3xl" onSubmit={submit}>
      <label className="block text-base font-medium text-[var(--ink)]">
        Property price
        <span className="mt-3 flex items-baseline gap-4 border-b-2 border-[var(--ink)] py-3 focus-within:border-[var(--gulf)]">
          <span className="text-lg text-[var(--muted)]">AED</span>
          <input
            className="min-h-14 min-w-0 flex-1 bg-transparent text-3xl font-medium tabular-nums tracking-[-0.03em] text-[var(--ink)] outline-none placeholder:text-[color-mix(in_oklch,var(--ink)_28%,transparent)] sm:text-4xl"
            inputMode="numeric"
            min="100000"
            onChange={(event) => {
              setPrice(event.target.value);
              setResult(null);
              setError("");
            }}
            placeholder="1,800,000"
            step="10000"
            type="number"
            value={price}
          />
        </span>
      </label>

      <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
        <label className="text-base font-medium text-[var(--ink-soft)]">
          Purchase type
          <select
            className={fieldClass}
            onChange={(event) => {
              setType(event.target.value as PurchaseType);
              setResult(null);
            }}
            value={type}
          >
            <option value="ready">Ready, secondary market</option>
            <option value="offplan">Off-plan, developer</option>
          </select>
        </label>

        {type === "ready" ? (
          <>
            <label className="text-base font-medium text-[var(--ink-soft)]">
              How are you buying?
              <select
                className={fieldClass}
                onChange={(event) => {
                  setFunding(event.target.value as FundingType);
                  setResult(null);
                }}
                value={funding}
              >
                <option value="mortgage">With a mortgage</option>
                <option value="cash">Cash</option>
              </select>
            </label>
            <label className="text-base font-medium text-[var(--ink-soft)]">
              Purpose
              <select
                className={fieldClass}
                onChange={(event) => {
                  setPurpose(event.target.value as PurchasePurpose);
                  setResult(null);
                }}
                value={purpose}
              >
                <option value="first">First home, to live</option>
                <option value="invest">Investment or second property</option>
              </select>
            </label>
          </>
        ) : (
          <label className="text-base font-medium text-[var(--ink-soft)]">
            Initial payment on plan
            <select
              className={fieldClass}
              onChange={(event) => {
                setInitialPayment(Number(event.target.value) as InitialPayment);
                setResult(null);
              }}
              value={initialPayment}
            >
              <option value="10">10%</option>
              <option value="20">20%</option>
              <option value="30">30%</option>
            </select>
          </label>
        )}
      </div>

      <button
        className="mt-10 min-h-12 rounded-full bg-[var(--ink)] px-6 py-3 text-base font-medium text-[var(--limestone)] transition-colors hover:bg-[var(--gulf)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gulf)]"
        type="submit"
      >
        Estimate the upfront cash
      </button>
      {error ? (
        <p className="mt-5 text-base font-medium text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <section
          aria-live="polite"
          className="mt-14 bg-[var(--ink)] px-6 py-10 text-[var(--limestone)] sm:px-10 sm:py-12"
        >
          <h3 className="max-w-2xl text-3xl font-medium tracking-[-0.035em] sm:text-4xl">
            Estimated upfront cash
          </h3>
          <p className="mt-3 text-lg text-[var(--limestone-deep)]">
            {result.heading}
          </p>
          <dl className="mt-8 border-t border-[color-mix(in_oklch,var(--limestone)_22%,transparent)]">
            {result.rows.map((row) => (
              <div
                className="flex items-start justify-between gap-6 border-b border-[color-mix(in_oklch,var(--limestone)_22%,transparent)] py-4 text-base"
                key={row.label}
              >
                <dt className="text-[var(--limestone-deep)]">{row.label}</dt>
                <dd className="shrink-0 font-medium tabular-nums">
                  {formatAED(row.amount)}
                </dd>
              </div>
            ))}
            <div className="flex items-start justify-between gap-6 py-6 text-lg font-medium">
              <dt>Estimated total upfront</dt>
              <dd className="shrink-0 tabular-nums">{formatAED(result.total)}</dd>
            </div>
          </dl>
          <p className="max-w-2xl text-base leading-7 text-[var(--limestone-deep)]">
            Indicative only. Confirm financing, professional fees and government
            charges for the exact property before you act.
          </p>
          <Link
            className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[var(--sea-glass)] px-6 py-3 text-base font-medium text-[var(--ink)] transition-colors hover:bg-[var(--limestone)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sea-glass)]"
            href="/?intent=buying#consultation"
          >
            Ask Iffy to check the budget
          </Link>
        </section>
      ) : null}
    </form>
  );
}
