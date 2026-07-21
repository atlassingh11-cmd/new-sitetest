"use client";

import { ArrowLeft, ArrowRight, CaretDown } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  ConsultationCalendar,
  focusConsultationDateControl,
  type ConsultationPreference,
} from "@/components/ui/consultation-calendar";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import {
  buildEmailUrl,
  buildLeadDraft,
  buildWhatsAppUrl,
  IFFY_EMAIL,
  IFFY_PHONE_DISPLAY,
  IFFY_PHONE_E164,
  readIntent,
  type LeadField,
  type LeadIntent,
  type ValidLead,
  validateLead,
} from "@/lib/lead";

const INTENT_OPTIONS: Array<{ value: LeadIntent; label: string }> = [
  { value: "buying", label: "Buying" },
  { value: "selling", label: "Selling" },
  { value: "investing", label: "Investing" },
  { value: "not-sure", label: "Not sure yet" },
];

type ConsultationStep = "intent" | "name" | "timing" | "channels";

interface FieldError {
  field: LeadField;
  message: string;
}

function IntentSearchSync({
  onIntentChange,
}: {
  onIntentChange: (intent: LeadIntent) => void;
}) {
  const searchParams = useSearchParams();
  const queryIntent = readIntent(searchParams.get("intent"));

  useEffect(() => {
    if (!queryIntent) return;
    const timer = window.setTimeout(() => onIntentChange(queryIntent), 0);
    return () => window.clearTimeout(timer);
  }, [onIntentChange, queryIntent]);

  return null;
}

function StepFrame({
  children,
  reducedMotion,
  step,
}: {
  children: ReactNode;
  reducedMotion: boolean;
  step: ConsultationStep;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="consultation-step"
      exit={reducedMotion ? undefined : { opacity: 0, y: -10 }}
      initial={reducedMotion ? false : { opacity: 0, y: 14 }}
      key={step}
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Consultation() {
  const id = useId();
  const reducedMotion = Boolean(useReducedMotion());
  const [name, setName] = useState("");
  const [intent, setIntent] = useState<LeadIntent | "">("");
  const [step, setStep] = useState<ConsultationStep>("intent");
  const [showTiming, setShowTiming] = useState(false);
  const [preference, setPreference] = useState<ConsultationPreference>({});
  const [lead, setLead] = useState<ValidLead | null>(null);
  const [error, setError] = useState<FieldError | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const intentRef = useRef<HTMLFieldSetElement>(null);
  const intentHeadingRef = useRef<HTMLLegendElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const timingHeadingRef = useRef<HTMLHeadingElement>(null);
  const channelHeadingRef = useRef<HTMLHeadingElement>(null);
  const draftDetailsRef = useRef<HTMLDetailsElement>(null);

  const syncIntent = useCallback((nextIntent: LeadIntent) => {
    setIntent(nextIntent);
    setLead(null);
    setError(null);
    setCopyStatus("");
    setStep("name");
  }, []);

  const draft = useMemo(() => (lead ? buildLeadDraft(lead) : ""), [lead]);
  const activeStepNumber = step === "intent" ? 1 : step === "name" ? 2 : 3;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (step === "name") nameRef.current?.focus({ preventScroll: true });
      if (step === "intent") {
        intentHeadingRef.current?.focus({ preventScroll: true });
      }
      if (step === "timing") {
        timingHeadingRef.current?.focus({ preventScroll: true });
      }
      if (step === "channels") {
        channelHeadingRef.current?.focus({ preventScroll: true });
        if (window.innerWidth <= 992) {
          channelHeadingRef.current?.scrollIntoView({
            behavior: reducedMotion ? "auto" : "smooth",
            block: "start",
          });
        }
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, [reducedMotion, step]);

  useEffect(() => {
    if (!showTiming || step !== "timing" || window.innerWidth > 992) return;
    const timer = window.setTimeout(() => {
      const calendar = calendarRef.current;
      if (!calendar) return;
      const top = window.scrollY + calendar.getBoundingClientRect().top - 76;
      window.scrollTo({
        behavior: reducedMotion ? "auto" : "smooth",
        left: window.scrollX,
        top,
      });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [preference.date, reducedMotion, showTiming, step]);

  function focusError(field: LeadField) {
    if (field === "intent") setStep("intent");
    if (field === "name") setStep("name");
    if (field === "date" || field === "window") {
      setStep("timing");
      setShowTiming(true);
    }

    requestAnimationFrame(() => {
      if (field === "name") nameRef.current?.focus();
      else if (field === "intent") {
        intentRef.current?.querySelector<HTMLInputElement>("input")?.focus();
      } else if (calendarRef.current) {
        focusConsultationDateControl(calendarRef.current);
      }
    });
  }

  function continueFromName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateLead({ name, intent });
    if (!result.ok) {
      setError({ field: result.field, message: result.message });
      focusError(result.field);
      return;
    }
    setName(result.value.name);
    setError(null);
    setStep("timing");
  }

  function continueToChannels(includePreference: boolean) {
    const nextPreference = includePreference ? preference : {};
    const result = validateLead({ name, intent, ...nextPreference });
    if (!result.ok) {
      setError({ field: result.field, message: result.message });
      focusError(result.field);
      return;
    }
    if (!includePreference) setPreference({});
    setName(result.value.name);
    setLead(result.value);
    setError(null);
    setCopyStatus("");
    setStep("channels");
  }

  function openDraft(channel: "whatsapp" | "email") {
    if (!lead) return;
    const result = validateLead(lead);
    if (!result.ok) {
      setLead(null);
      setError({ field: result.field, message: result.message });
      focusError(result.field);
      return;
    }
    const currentDraft = buildLeadDraft(result.value);
    const url =
      channel === "whatsapp"
        ? buildWhatsAppUrl(currentDraft)
        : buildEmailUrl(currentDraft);
    const externalWindow = window.open(url, "_blank", "noopener,noreferrer");
    if (externalWindow) {
      externalWindow.opener = null;
      return;
    }

    if (draftDetailsRef.current) draftDetailsRef.current.open = true;
    setCopyStatus(
      "If nothing opened, copy the message below or use a direct contact link.",
    );
  }

  async function copyDraft() {
    if (!lead) return;
    const result = validateLead(lead);
    if (!result.ok) {
      setLead(null);
      setError({ field: result.field, message: result.message });
      focusError(result.field);
      return;
    }
    const currentDraft = buildLeadDraft(result.value);
    try {
      await navigator.clipboard.writeText(currentDraft);
      setCopyStatus("Draft copied to your clipboard.");
    } catch {
      setCopyStatus("Select the draft below to copy it.");
    }
  }

  const nameErrorId = `${id}-name-error`;
  const intentErrorId = `${id}-intent-error`;
  const fieldClass =
    "mt-4 min-h-16 w-full border-b border-[color-mix(in_oklch,var(--ink)_36%,transparent)] bg-transparent px-0 py-3 text-[clamp(1.5rem,3vw,2.25rem)] font-medium tracking-[-0.035em] text-[var(--ink)] outline-none placeholder:text-[color-mix(in_oklch,var(--ink)_24%,transparent)] focus-visible:border-b-2 focus-visible:border-[var(--gulf)] focus-visible:shadow-[0_2px_0_0_var(--gulf)] focus-visible:!outline-none";

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className="consultation-atmosphere consultation-stage text-[var(--ink)]"
      data-scroll-chapter=""
      id="consultation"
    >
      <Suspense fallback={null}>
        <IntentSearchSync onIntentChange={syncIntent} />
      </Suspense>

      <div className="consultation-layout">
        <div className="consultation-content">
          {step !== "channels" ? (
            <header>
              <h2
                className="max-w-[11ch] text-balance text-[clamp(3.25rem,6vw,5.6rem)] font-medium leading-[0.92] tracking-[-0.06em]"
                id={`${id}-heading`}
              >
                Tell me what you&apos;re weighing up.
              </h2>
              <p className="mt-6 max-w-[36rem] text-lg leading-8 text-[var(--ink-soft)]">
                Three quick choices. I&apos;ll reply personally.
              </p>
            </header>
          ) : (
            <h2 className="sr-only" id={`${id}-heading`}>
              Contact Iffy
            </h2>
          )}

          {step !== "channels" ? (
            <div className="mt-10 flex items-center gap-3 text-sm font-semibold text-[var(--muted)]">
              <span>{activeStepNumber} / 3</span>
              <span className="h-px flex-1 bg-[color-mix(in_oklch,var(--ink)_18%,transparent)]">
                <span
                  className="block h-full bg-[var(--gulf)] transition-[width] duration-500 ease-[var(--ease-out-quint)] motion-reduce:transition-none"
                  style={{ width: `${(activeStepNumber / 3) * 100}%` }}
                />
              </span>
            </div>
          ) : null}

          <AnimatePresence initial={false} mode="wait">
            {step === "intent" ? (
              <StepFrame reducedMotion={reducedMotion} step={step}>
                <fieldset
                  aria-describedby={error?.field === "intent" ? intentErrorId : undefined}
                  aria-invalid={error?.field === "intent" || undefined}
                  ref={intentRef}
                >
                  <legend
                    className="text-[clamp(1.65rem,3vw,2.4rem)] font-medium leading-tight tracking-[-0.04em]"
                    data-consultation-step-heading=""
                    ref={intentHeadingRef}
                    tabIndex={-1}
                  >
                    What are you weighing up?
                  </legend>
                  <div className="mt-7 grid sm:grid-cols-2">
                    {INTENT_OPTIONS.map((option) => (
                      <label
                        className="group relative flex min-h-20 cursor-pointer items-center justify-between gap-5 border-b border-[color-mix(in_oklch,var(--ink)_18%,transparent)] py-4 text-xl font-medium outline-none sm:odd:mr-5 sm:even:ml-5 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-[var(--gulf)]"
                        key={option.value}
                      >
                        <input
                          checked={intent === option.value}
                          className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                          name="intent"
                          onChange={() => syncIntent(option.value)}
                          type="radio"
                          value={option.value}
                        />
                        <span className="pointer-events-none">{option.label}</span>
                        <ArrowRight
                          aria-hidden="true"
                          className="pointer-events-none transition-transform duration-300 ease-[var(--ease-out-quint)] group-hover:translate-x-1"
                          size={22}
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>
                {error?.field === "intent" ? (
                  <p className="mt-4 text-sm font-semibold text-[var(--danger)]" id={intentErrorId} role="alert">
                    {error.message}
                  </p>
                ) : null}
              </StepFrame>
            ) : null}

            {step === "name" ? (
              <StepFrame reducedMotion={reducedMotion} step={step}>
                <form noValidate onSubmit={continueFromName}>
                  <label className="block" htmlFor={`${id}-name`}>
                    <span className="text-[clamp(1.65rem,3vw,2.4rem)] font-medium leading-tight tracking-[-0.04em]">
                      What should I call you?
                    </span>
                    <input
                      aria-describedby={error?.field === "name" ? nameErrorId : undefined}
                      aria-invalid={error?.field === "name" || undefined}
                      autoComplete="name"
                      className={fieldClass}
                      id={`${id}-name`}
                      maxLength={80}
                      name="name"
                      onChange={(event) => {
                        setName(event.target.value);
                        if (error?.field === "name" && event.target.value.trim()) setError(null);
                      }}
                      placeholder="Your name"
                      ref={nameRef}
                      value={name}
                    />
                  </label>
                  {error?.field === "name" ? (
                    <p className="mt-3 text-sm font-semibold text-[var(--danger)]" id={nameErrorId} role="alert">
                      {error.message}
                    </p>
                  ) : null}
                  <div className="mt-8 flex flex-wrap items-center gap-5">
                    <button
                      className="inline-flex min-h-12 items-center gap-2 px-1 text-sm font-semibold underline decoration-[var(--sea-glass)] decoration-2 underline-offset-4"
                      onClick={() => setStep("intent")}
                      type="button"
                    >
                      <ArrowLeft aria-hidden="true" size={16} /> Back
                    </button>
                    <button
                      className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-7 py-3 text-base font-semibold text-[var(--limestone)] transition-colors hover:bg-[var(--gulf)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gulf)]"
                      type="submit"
                    >
                      Continue <ArrowRight aria-hidden="true" size={17} />
                    </button>
                  </div>
                </form>
              </StepFrame>
            ) : null}

            {step === "timing" ? (
              <StepFrame reducedMotion={reducedMotion} step={step}>
                <h3
                  className="text-[clamp(1.65rem,3vw,2.4rem)] font-medium leading-tight tracking-[-0.04em] outline-none"
                  data-consultation-step-heading=""
                  ref={timingHeadingRef}
                  tabIndex={-1}
                >
                  Would a time help?
                </h3>
                <p className="mt-3 max-w-[32rem] text-base leading-7 text-[var(--muted)]">
                  Skip it, or choose a Dubai-time preference.
                </p>
                <div className="mt-7 border-t border-[color-mix(in_oklch,var(--ink)_18%,transparent)]">
                  <button
                    className="group flex min-h-16 w-full items-center justify-between border-b border-[color-mix(in_oklch,var(--ink)_18%,transparent)] py-4 text-left text-lg font-medium"
                    onClick={() => continueToChannels(false)}
                    type="button"
                  >
                    No time preference
                    <ArrowRight aria-hidden="true" className="transition-transform group-hover:translate-x-1" size={21} />
                  </button>
                  <button
                    aria-controls={`${id}-timing`}
                    aria-expanded={showTiming}
                    className="flex min-h-16 w-full items-center justify-between border-b border-[color-mix(in_oklch,var(--ink)_18%,transparent)] py-4 text-left text-lg font-medium"
                    onClick={() => setShowTiming((current) => !current)}
                    type="button"
                  >
                    {showTiming ? "Hide the calendar" : "Choose a preferred time"}
                    <CaretDown
                      aria-hidden="true"
                      className={`transition-transform duration-300 ease-[var(--ease-out-quint)] ${showTiming ? "rotate-180" : ""}`}
                      size={20}
                    />
                  </button>
                </div>
                <button
                  className="mt-7 inline-flex min-h-12 items-center gap-2 px-1 text-sm font-semibold underline decoration-[var(--sea-glass)] decoration-2 underline-offset-4"
                  onClick={() => setStep("name")}
                  type="button"
                >
                  <ArrowLeft aria-hidden="true" size={16} /> Back
                </button>
              </StepFrame>
            ) : null}

            {step === "channels" && lead ? (
              <StepFrame reducedMotion={reducedMotion} step={step}>
                <h3
                  className="max-w-[8ch] scroll-mt-24 text-[clamp(3.25rem,6vw,5.2rem)] font-medium leading-[0.94] tracking-[-0.06em] outline-none"
                  id={`${id}-channel-heading`}
                  ref={channelHeadingRef}
                  tabIndex={-1}
                >
                  Ready when you are.
                </h3>
                <p className="mt-4 max-w-[32rem] text-lg leading-8 text-[var(--muted)]">
                  Nothing is sent until you choose a channel.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    className="min-h-13 rounded-full bg-[var(--ink)] px-7 py-3 text-base font-semibold text-[var(--limestone)] transition-colors hover:bg-[var(--gulf)]"
                    onClick={() => openDraft("whatsapp")}
                    type="button"
                  >
                    Continue on WhatsApp
                  </button>
                  <button
                    className="min-h-13 rounded-full bg-[var(--limestone-deep)] px-7 py-3 text-base font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--sea-glass)]"
                    onClick={() => openDraft("email")}
                    type="button"
                  >
                    Draft an email
                  </button>
                </div>
                <button
                  className="mt-6 min-h-11 py-2 text-sm font-semibold underline decoration-[var(--sea-glass)] decoration-2 underline-offset-4"
                  onClick={() => {
                    setLead(null);
                    setStep("name");
                    setCopyStatus("");
                  }}
                  type="button"
                >
                  Edit details
                </button>

                <details
                  className="mt-7 border-t border-[color-mix(in_oklch,var(--ink)_16%,transparent)] pt-2"
                  ref={draftDetailsRef}
                >
                  <summary className="min-h-12 cursor-pointer py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gulf)]">
                    Review message
                  </summary>
                  <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-7 text-[var(--ink-soft)]">
                    {draft}
                  </pre>
                  <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[color-mix(in_oklch,var(--ink)_14%,transparent)] pt-5 text-sm">
                    <button className="min-h-11 py-2 font-semibold underline decoration-[var(--sea-glass)] decoration-2 underline-offset-4" onClick={copyDraft} type="button">
                      Copy draft
                    </button>
                    <a className="min-h-11 py-2 underline underline-offset-4" href={`https://wa.me/${IFFY_PHONE_E164}`} rel="noopener noreferrer" target="_blank">
                      WhatsApp {IFFY_PHONE_DISPLAY}
                    </a>
                    <a className="min-h-11 py-2 underline underline-offset-4" href={`mailto:${IFFY_EMAIL}`}>
                      {IFFY_EMAIL}
                    </a>
                    <a className="min-h-11 py-2 underline underline-offset-4" href={`tel:+${IFFY_PHONE_E164}`}>
                      Call {IFFY_PHONE_DISPLAY}
                    </a>
                  </div>
                  <p aria-live="polite" className="mt-3 text-sm text-[var(--muted)]">
                    {copyStatus}
                  </p>
                </details>
              </StepFrame>
            ) : null}
          </AnimatePresence>
        </div>

        <div
          className="consultation-media"
          data-calendar-open={step === "timing" && showTiming ? "true" : "false"}
        >
          <Image
            alt="Iffy Khan reviewing a property brief"
            className={`consultation-media__asset consultation-media__person ${
              step === "timing" && showTiming ? "is-hidden" : ""
            }`}
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 48vw, 100vw"
            src="/media/iffy-laptop.webp"
          />
          <Image
            alt=""
            aria-hidden="true"
            className={`consultation-media__asset consultation-media__calendar-backdrop ${
              step === "timing" && showTiming ? "is-visible" : ""
            }`}
            fill
            loading="lazy"
            sizes="(min-width: 1024px) 48vw, 100vw"
            src="/media/hero-interior.webp"
          />
          <div className="consultation-media__shade" />

          <AnimatePresence>
            {step === "timing" && showTiming ? (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="consultation-calendar-float"
                exit={reducedMotion ? undefined : { opacity: 0, y: 12 }}
                id={`${id}-timing`}
                initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                ref={calendarRef}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="sr-only" id={`${id}-timing-label`}>
                  Dubai time. This is a preference, not a booking.
                </p>
                <ConsultationCalendar
                  className="max-w-none"
                  error={error?.field === "date" || error?.field === "window" ? error.message : undefined}
                  errorId={`${id}-calendar-error`}
                  labelledBy={`${id}-timing-label`}
                  onChange={(value) => {
                    setPreference(value);
                    if (error?.field === "date" || error?.field === "window") setError(null);
                  }}
                  value={preference}
                />
                <LiquidGlass
                  className="mt-4 w-full text-[var(--paper)]"
                  disabled={!preference.date || !preference.window}
                  onClick={() => continueToChannels(true)}
                  tone="dark"
                >
                  {preference.date
                    ? preference.window
                      ? "Use this time"
                      : "Choose a time"
                    : "Choose a day"}
                  <ArrowRight aria-hidden="true" size={17} />
                </LiquidGlass>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
