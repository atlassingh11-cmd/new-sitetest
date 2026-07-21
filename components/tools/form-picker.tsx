"use client";

import {
  type FormEvent,
  useId,
  useRef,
  useState,
} from "react";
import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";

export interface FormPickerQuestion {
  name: string;
  legend: string;
  options: readonly (readonly [string, string])[];
}

interface FormPickerProps {
  questions: readonly FormPickerQuestion[];
  answers: object;
  onAnswer: (name: string, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  actionLabel: string;
  error?: string;
}

export function FormPicker({
  questions,
  answers,
  onAnswer,
  onSubmit,
  actionLabel,
  error,
}: FormPickerProps) {
  const id = useId();
  const [activeStep, setActiveStep] = useState(0);
  const panelRef = useRef<HTMLFieldSetElement>(null);
  const question = questions[activeStep];
  const selectedValue = Reflect.get(answers, question.name) as
    | string
    | undefined;
  const isLastStep = activeStep === questions.length - 1;

  function moveTo(step: number) {
    setActiveStep(step);
    requestAnimationFrame(() =>
      panelRef.current?.focus({ preventScroll: true }),
    );
  }

  return (
    <form className="max-w-[52rem]" onSubmit={onSubmit}>
      <div className="min-w-0">
        <fieldset
          className="form-picker-panel min-w-0 outline-none"
          key={question.name}
          ref={panelRef}
          tabIndex={-1}
        >
          <legend
            className="max-w-2xl text-balance text-[clamp(1.65rem,7.5vw,2.6rem)] font-medium leading-[1.04] tracking-[-0.035em] text-[var(--ink)]"
            id={`${id}-${question.name}`}
          >
            {question.legend}
          </legend>
          <p
            aria-label={`Question ${activeStep + 1} of ${questions.length}`}
            aria-live="polite"
            className="mt-3 text-right text-sm font-medium tabular-nums text-[var(--muted)]"
          >
            {activeStep + 1} / {questions.length}
          </p>

          <div className="mt-4 border-y border-[color-mix(in_oklch,var(--ink)_24%,transparent)] sm:mt-6">
            {question.options.map(([value, label]) => {
              const selected = selectedValue === value;

              return (
                <label
                  className={`form-picker-option group relative grid min-h-[4.25rem] cursor-pointer grid-cols-[minmax(0,1fr)_1.75rem] items-center gap-4 border-b border-[color-mix(in_oklch,var(--ink)_14%,transparent)] px-1 py-3 text-base transition-[background-color,color,padding] duration-300 ease-[var(--ease-out-quint)] last:border-b-0 has-[:focus-visible]:z-10 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-[var(--gulf)] motion-reduce:transition-none sm:min-h-20 sm:px-4 sm:text-lg ${
                    selected
                      ? "bg-[var(--ink)] px-4 text-[var(--limestone)]"
                      : "text-[var(--ink-soft)] hover:bg-[color-mix(in_oklch,var(--sea-glass)_18%,transparent)] hover:text-[var(--ink)]"
                  }`}
                  data-selected={selected ? "true" : "false"}
                  key={value}
                >
                  <input
                    checked={selected}
                    className="peer sr-only"
                    name={question.name}
                    onChange={() => onAnswer(question.name, value)}
                    type="radio"
                    value={value}
                  />
                  <span className="pointer-events-none font-medium leading-6 tracking-[-0.01em]">
                    {label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none grid size-6 place-items-center justify-self-end rounded-full border transition-colors duration-300 motion-reduce:transition-none ${
                      selected
                        ? "border-[var(--sea-glass)] bg-[var(--sea-glass)] text-[var(--ink)]"
                        : "border-[color-mix(in_oklch,var(--ink)_48%,transparent)] text-transparent group-hover:border-[var(--ink)]"
                    }`}
                  >
                    <Check size={14} weight="bold" />
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {error ? (
          <p className="mt-4 text-base font-medium text-[var(--danger)]" role="alert">
            {error}
          </p>
        ) : null}

        {activeStep > 0 || selectedValue ? (
          <div className="mt-6 flex min-h-11 flex-wrap items-center justify-between gap-4 sm:mt-7">
            {activeStep > 0 ? (
              <button
                className="inline-flex min-h-12 items-center gap-2 py-3 text-base font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gulf)]"
                onClick={() => moveTo(activeStep - 1)}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={17} weight="bold" />
                Back
              </button>
            ) : (
              <span aria-hidden="true" />
            )}

            {!selectedValue ? null : isLastStep ? (
              <button
                className="form-picker-action ml-auto inline-flex min-h-11 items-center gap-3 border-b border-current py-2 text-base font-semibold text-[var(--ink)] transition-colors hover:text-[var(--gulf)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gulf)]"
                type="submit"
              >
                {actionLabel}
                <ArrowRight aria-hidden="true" size={17} weight="bold" />
              </button>
            ) : (
              <button
                className="form-picker-action ml-auto inline-flex min-h-11 items-center gap-3 border-b border-current py-2 text-base font-semibold text-[var(--ink)] transition-colors hover:text-[var(--gulf)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gulf)]"
                onClick={() => moveTo(activeStep + 1)}
                type="button"
              >
                Next
                <ArrowRight aria-hidden="true" size={17} weight="bold" />
              </button>
            )}
          </div>
        ) : null}
      </div>
    </form>
  );
}
