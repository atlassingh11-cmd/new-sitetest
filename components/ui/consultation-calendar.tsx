"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";

import {
  addDays,
  CONSULTATION_TIME_WINDOWS,
  dateToIso,
  getDubaiPreferenceBounds,
  isoToDate,
  isValidDubaiPreferenceDate,
  type ConsultationPreference,
} from "@/lib/consultation-preference";
import { cn } from "@/lib/utils";

export {
  CONSULTATION_TIME_WINDOWS,
  getDubaiPreferenceBounds,
  isValidDubaiPreferenceDate,
} from "@/lib/consultation-preference";
export type {
  ConsultationPreference,
  ConsultationTimeWindow,
} from "@/lib/consultation-preference";

export interface ConsultationCalendarProps {
  value: ConsultationPreference;
  onChange: (value: ConsultationPreference) => void;
  error?: string;
  errorId?: string;
  labelledBy?: string;
  className?: string;
}

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const LONG_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const SHORT_WEEKDAY_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  timeZone: "UTC",
});
const CLOCK_NEUTRAL_MONTH = new Date(Date.UTC(2000, 0, 1, 12));
const DUBAI_UTC_OFFSET_MS = 4 * 60 * 60 * 1_000;

type PreferenceBounds = ReturnType<typeof getDubaiPreferenceBounds>;

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0, 12)).getUTCDate();
}

function clampIso(value: string, minimum: string, maximum: string): string {
  if (value < minimum) return minimum;
  if (value > maximum) return maximum;
  return value;
}

function isWithinBounds(
  value: string | undefined,
  bounds: PreferenceBounds,
): value is string {
  return Boolean(
    value &&
      isValidDubaiPreferenceDate(value) &&
      value >= bounds.min &&
      value <= bounds.max,
  );
}

function millisecondsUntilNextDubaiDay(now: Date): number {
  const [year, month, day] = getDubaiPreferenceBounds(now).min
    .split("-")
    .map(Number);
  const nextDubaiMidnight =
    Date.UTC(year, month - 1, day) - DUBAI_UTC_OFFSET_MS;
  return Math.max(1_000, nextDubaiMidnight - now.getTime() + 50);
}

function monthStart(value: string): Date {
  const date = isoToDate(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
}

function formatMonth(value: Date): string {
  return MONTH_FORMATTER.format(value);
}

function formatLongDate(value: string): string {
  return LONG_DATE_FORMATTER.format(isoToDate(value));
}

function formatShortWeekday(value: string): string {
  return SHORT_WEEKDAY_FORMATTER.format(isoToDate(value));
}

export function focusConsultationDateControl(
  container: ParentNode | null,
): boolean {
  const control = container?.querySelector<HTMLElement>(
    "[data-date-input]:not([disabled])",
  );
  control?.focus();
  return Boolean(control);
}

function CalendarChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 20 20"
    >
      <path
        d={direction === "left" ? "m12 15-5-5 5-5" : "m8 5 5 5-5 5"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export const ConsultationCalendar = React.forwardRef<
  HTMLDivElement,
  ConsultationCalendarProps
>(function ConsultationCalendar(
  { value, onChange, error, errorId, labelledBy, className },
  forwardedRef,
) {
  const titleId = React.useId();
  const monthId = React.useId();
  const internalErrorId = React.useId();
  const selectedStatusId = React.useId();
  const describedBy = error ? errorId ?? internalErrorId : undefined;
  const prefersReducedMotion = useReducedMotion();
  const [bounds, setBounds] = React.useState<PreferenceBounds | null>(null);
  const [currentMonth, setCurrentMonth] = React.useState<Date | null>(null);
  const [focusedDate, setFocusedDate] = React.useState<string | null>(null);
  const previousSelectedDateRef = React.useRef<string | undefined>(undefined);
  const shouldFocusRef = React.useRef(false);
  const hasPositionedRailRef = React.useRef(false);
  const railRef = React.useRef<HTMLDivElement>(null);
  const dayRefs = React.useRef(new Map<string, HTMLButtonElement>());

  const min = bounds?.min ?? "";
  const max = bounds?.max ?? "";
  const selectedDate = bounds && isWithinBounds(value.date, bounds)
    ? value.date
    : undefined;
  const selectedWindow = selectedDate ? value.window : undefined;
  const proposedFocusedDate = focusedDate ?? selectedDate ?? min;
  const clampedFocusedDate = bounds
    ? clampIso(proposedFocusedDate, min, max)
    : "";

  const candidateMonth = bounds
    ? currentMonth ?? monthStart(clampedFocusedDate)
    : CLOCK_NEUTRAL_MONTH;
  const candidateMonthIso = dateToIso(candidateMonth);
  const minMonthIso = bounds ? dateToIso(monthStart(min)) : "";
  const maxMonthIso = bounds ? dateToIso(monthStart(max)) : "";
  const displayedMonth =
    bounds && (candidateMonthIso < minMonthIso || candidateMonthIso > maxMonthIso)
      ? monthStart(clampedFocusedDate)
      : candidateMonth;

  React.useEffect(() => {
    let midnightTimer = 0;

    const refreshBounds = () => {
      const now = new Date();
      const nextBounds = getDubaiPreferenceBounds(now);
      setBounds((current) =>
        current?.min === nextBounds.min && current.max === nextBounds.max
          ? current
          : nextBounds,
      );
      window.clearTimeout(midnightTimer);
      midnightTimer = window.setTimeout(
        refreshBounds,
        millisecondsUntilNextDubaiDay(now),
      );
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshBounds();
    };

    refreshBounds();
    window.addEventListener("focus", refreshBounds);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearTimeout(midnightTimer);
      window.removeEventListener("focus", refreshBounds);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  React.useEffect(() => {
    if (!bounds) return;

    const selectedDateChanged =
      selectedDate !== previousSelectedDateRef.current;
    previousSelectedDateRef.current = selectedDate;
    const nextFocusedDate = clampIso(
      selectedDateChanged && selectedDate
        ? selectedDate
        : focusedDate ?? selectedDate ?? bounds.min,
      bounds.min,
      bounds.max,
    );

    setFocusedDate((current) =>
      current === nextFocusedDate ? current : nextFocusedDate,
    );
    setCurrentMonth((current) => {
      const nextMonth =
        selectedDateChanged && selectedDate
          ? monthStart(selectedDate)
          : current ?? monthStart(nextFocusedDate);
      const nextMonthIso = dateToIso(nextMonth);
      const lowerMonth = dateToIso(monthStart(bounds.min));
      const upperMonth = dateToIso(monthStart(bounds.max));
      if (nextMonthIso < lowerMonth || nextMonthIso > upperMonth) {
        return monthStart(nextFocusedDate);
      }
      return nextMonth;
    });
  }, [bounds, focusedDate, selectedDate]);

  React.useEffect(() => {
    if (!bounds || !clampedFocusedDate) return;
    const control = dayRefs.current.get(clampedFocusedDate);
    const rail = railRef.current;
    if (!control || !rail) return;

    if (!hasPositionedRailRef.current || shouldFocusRef.current) {
      const railRect = rail.getBoundingClientRect();
      const controlRect = control.getBoundingClientRect();
      const nextLeft =
        rail.scrollLeft +
        controlRect.left -
        railRect.left -
        (rail.clientWidth - controlRect.width) / 2;
      const left = Math.max(0, nextLeft);
      if (typeof rail.scrollTo === "function") {
        rail.scrollTo({ left, behavior: "auto" });
      } else {
        rail.scrollLeft = left;
      }
      hasPositionedRailRef.current = true;
    }

    if (shouldFocusRef.current) {
      shouldFocusRef.current = false;
      control.focus({ preventScroll: true });
    }
  }, [bounds, clampedFocusedDate, currentMonth]);

  const { currentYear, currentMonthIndex, currentMonthLabel, monthDates } =
    React.useMemo(() => {
      const year = displayedMonth.getUTCFullYear();
      const monthIndex = displayedMonth.getUTCMonth();
      const monthDayCount = daysInMonth(year, monthIndex);

      return {
        currentYear: year,
        currentMonthIndex: monthIndex,
        currentMonthLabel: formatMonth(displayedMonth),
        monthDates: Array.from({ length: monthDayCount }, (_, index) =>
          dateToIso(new Date(Date.UTC(year, monthIndex, index + 1, 12))),
        ),
      };
    }, [displayedMonth]);

  const moveFocus = React.useCallback(
    (nextDate: string) => {
      if (!bounds) return;
      const clamped = clampIso(nextDate, min, max);
      shouldFocusRef.current = true;
      setFocusedDate(clamped);
      setCurrentMonth(monthStart(clamped));
    },
    [bounds, max, min],
  );

  const moveByMonth = React.useCallback(
    (amount: number) => {
      if (!clampedFocusedDate) return;
      const focused = isoToDate(clampedFocusedDate);
      const targetMonthStart = new Date(
        Date.UTC(
          focused.getUTCFullYear(),
          focused.getUTCMonth() + amount,
          1,
          12,
        ),
      );
      const day = Math.min(
        focused.getUTCDate(),
        daysInMonth(
          targetMonthStart.getUTCFullYear(),
          targetMonthStart.getUTCMonth(),
        ),
      );
      targetMonthStart.setUTCDate(day);
      moveFocus(dateToIso(targetMonthStart));
    },
    [clampedFocusedDate, moveFocus],
  );

  const handleDayKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    let handled = true;
    switch (event.key) {
      case "ArrowLeft":
        moveFocus(addDays(clampedFocusedDate, -1));
        break;
      case "ArrowRight":
        moveFocus(addDays(clampedFocusedDate, 1));
        break;
      case "ArrowUp":
        moveFocus(addDays(clampedFocusedDate, -7));
        break;
      case "ArrowDown":
        moveFocus(addDays(clampedFocusedDate, 7));
        break;
      case "Home": {
        const weekday = (isoToDate(clampedFocusedDate).getUTCDay() + 6) % 7;
        moveFocus(addDays(clampedFocusedDate, -weekday));
        break;
      }
      case "End": {
        const weekday = (isoToDate(clampedFocusedDate).getUTCDay() + 6) % 7;
        moveFocus(addDays(clampedFocusedDate, 6 - weekday));
        break;
      }
      case "PageUp":
        moveByMonth(event.shiftKey ? -12 : -1);
        break;
      case "PageDown":
        moveByMonth(event.shiftKey ? 12 : 1);
        break;
      default:
        handled = false;
    }
    if (handled) event.preventDefault();
  };

  const chooseDate = (date: string) => {
    if (!bounds || !isWithinBounds(date, bounds)) return;
    setFocusedDate(date);
    onChange({
      date,
      ...(selectedDate && selectedWindow ? { window: selectedWindow } : {}),
    });
  };

  const currentMonthFirst = dateToIso(displayedMonth);
  const previousMonthAllowed = bounds
    ? currentMonthFirst > dateToIso(monthStart(min))
    : false;
  const nextMonth = new Date(
    Date.UTC(currentYear, currentMonthIndex + 1, 1, 12),
  );
  const nextMonthAllowed = bounds ? dateToIso(nextMonth) <= max : false;
  const useNativeDateInput = !bounds;

  return (
    <div
      aria-describedby={describedBy}
      aria-labelledby={labelledBy ?? titleId}
      className={cn(
        "w-full max-w-[22.5rem] overflow-hidden rounded-3xl border border-white/10 bg-black/20 p-4 text-white shadow-2xl backdrop-blur-xl sm:p-5 forced-colors:border forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]",
        className,
      )}
      ref={forwardedRef}
      role="group"
    >
      {useNativeDateInput ? (
        <div>
          <h3 className="text-sm font-semibold text-[color-mix(in_oklch,var(--limestone)_74%,transparent)]" id={titleId}>
            Preferred day
          </h3>
          <label className="sr-only" htmlFor={`${titleId}-native`}>
            Preferred day in Dubai
          </label>
          <input
            aria-describedby={describedBy}
            aria-invalid={error ? "true" : undefined}
            className="mt-4 min-h-14 w-full rounded-xl bg-[color-mix(in_oklch,var(--paper)_12%,transparent)] px-4 text-base text-[var(--limestone)] outline-none ring-1 ring-[color-mix(in_oklch,var(--paper)_18%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--sea-glass)] forced-colors:border"
            data-date-input=""
            id={`${titleId}-native`}
            onChange={(event) => chooseDate(event.currentTarget.value)}
            type="date"
            value={value.date ?? ""}
          />
        </div>
      ) : (
        <>
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3
                className="text-sm font-semibold text-[color-mix(in_oklch,var(--limestone)_68%,transparent)]"
                id={titleId}
              >
                Preferred day
              </h3>
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                aria-live="polite"
                className="mt-1 text-[clamp(1.9rem,8vw,2.65rem)] font-semibold leading-none tracking-[-0.055em]"
                id={monthId}
                initial={
                  prefersReducedMotion ? false : { opacity: 0.72, y: -6 }
                }
                key={currentMonthLabel}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                {currentMonthLabel}
              </motion.p>
            </div>

            <div className="flex shrink-0 gap-1.5">
              <button
                aria-label="Show previous month"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--paper)_7%,transparent)] text-[color-mix(in_oklch,var(--limestone)_76%,transparent)] outline-none transition-colors hover:bg-[color-mix(in_oklch,var(--paper)_13%,transparent)] hover:text-[var(--limestone)] focus-visible:ring-2 focus-visible:ring-[var(--sea-glass)] disabled:cursor-not-allowed disabled:opacity-30 forced-colors:border"
                disabled={!previousMonthAllowed}
                onClick={() => moveByMonth(-1)}
                type="button"
              >
                <CalendarChevron direction="left" />
              </button>
              <button
                aria-label="Show next month"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--paper)_7%,transparent)] text-[color-mix(in_oklch,var(--limestone)_76%,transparent)] outline-none transition-colors hover:bg-[color-mix(in_oklch,var(--paper)_13%,transparent)] hover:text-[var(--limestone)] focus-visible:ring-2 focus-visible:ring-[var(--sea-glass)] disabled:cursor-not-allowed disabled:opacity-30 forced-colors:border"
                disabled={!nextMonthAllowed}
                onClick={() => moveByMonth(1)}
                type="button"
              >
                <CalendarChevron direction="right" />
              </button>
            </div>
          </div>

          <div className="mt-4 flex min-h-11 items-center justify-between gap-4 text-sm">
            <p className="leading-5 text-[color-mix(in_oklch,var(--limestone)_66%,transparent)]">
              {selectedDate
                ? formatLongDate(selectedDate)
                : "Choose a day, then a time. Dubai time."}
            </p>
            {selectedDate ? (
              <button
                aria-label="Clear day"
                className="min-h-11 shrink-0 px-1 font-semibold text-[var(--limestone)] underline decoration-[var(--sea-glass)] decoration-2 underline-offset-4 outline-none hover:decoration-current focus-visible:ring-2 focus-visible:ring-[var(--sea-glass)]"
                onClick={() => onChange({})}
                type="button"
              >
                Clear
              </button>
            ) : null}
          </div>

          <div
            aria-describedby={
              [selectedStatusId, describedBy].filter(Boolean).join(" ") ||
              undefined
            }
            aria-labelledby={`${titleId} ${monthId}`}
            className="-mx-4 mt-3 snap-x snap-mandatory overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-5 sm:px-5"
            ref={railRef}
            role="grid"
          >
            <div className="flex min-w-max gap-2" role="row">
              {monthDates.map((date) => {
                const dateValue = isoToDate(date);
                const isSelected = date === selectedDate;
                const isFocused = date === clampedFocusedDate;
                const isAvailable = Boolean(
                  bounds && date >= min && date <= max,
                );

                return (
                  <div
                    aria-selected={isSelected}
                    className="flex w-11 snap-center flex-col items-center gap-1.5"
                    key={date}
                    role="gridcell"
                  >
                    <span
                      aria-hidden="true"
                      className="text-[0.66rem] font-semibold text-[color-mix(in_oklch,var(--limestone)_48%,transparent)]"
                    >
                      {formatShortWeekday(date)}
                    </span>
                    <button
                      aria-label={formatLongDate(date)}
                      className={cn(
                        "relative grid min-h-11 min-w-11 place-items-center rounded-full text-sm font-semibold tabular-nums outline-none transition-[background-color,color,opacity] duration-200 focus-visible:ring-2 focus-visible:ring-[var(--sea-glass)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ink)] forced-colors:border",
                        isSelected
                          ? "bg-[var(--limestone)] text-[var(--ink)] shadow-lg"
                          : "text-[var(--limestone)] hover:bg-[color-mix(in_oklch,var(--paper)_12%,transparent)]",
                        !isAvailable &&
                          "cursor-not-allowed text-[color-mix(in_oklch,var(--limestone)_22%,transparent)] opacity-60",
                      )}
                      data-date-input={isFocused ? "" : undefined}
                      disabled={!isAvailable}
                      onClick={() => chooseDate(date)}
                      onFocus={() => setFocusedDate(date)}
                      onKeyDown={handleDayKeyDown}
                      ref={(node) => {
                        if (node) dayRefs.current.set(date, node);
                        else dayRefs.current.delete(date);
                      }}
                      tabIndex={isFocused ? 0 : -1}
                      type="button"
                    >
                      {dateValue.getUTCDate()}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <p aria-live="polite" className="sr-only" id={selectedStatusId}>
        {selectedDate
          ? `Preferred day selected, ${formatLongDate(selectedDate)}`
          : "No preferred day selected"}
      </p>

      {selectedDate ? (
        <fieldset className="mt-4 border-t border-[color-mix(in_oklch,var(--paper)_13%,transparent)] pt-4">
          <legend className="text-sm font-semibold">Preferred time</legend>
          <p className="mt-1 text-xs leading-5 text-[color-mix(in_oklch,var(--limestone)_58%,transparent)]">
            Iffy will confirm the exact time with you.
          </p>
          <div className="mt-3 border-t border-[color-mix(in_oklch,var(--paper)_14%,transparent)]">
            {CONSULTATION_TIME_WINDOWS.map((option) => {
              const selected = selectedWindow === option.value;

              return (
                <label
                  className={cn(
                    "relative flex min-h-12 cursor-pointer items-center justify-between border-b border-[color-mix(in_oklch,var(--paper)_14%,transparent)] px-1 text-left outline-none transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-[var(--sea-glass)]",
                    selected
                      ? "bg-[var(--limestone)] text-[var(--ink)]"
                      : "text-[var(--limestone)] hover:bg-[color-mix(in_oklch,var(--paper)_10%,transparent)]",
                  )}
                  key={option.value}
                >
                  <input
                    aria-label={option.label}
                    checked={selected}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                    name={`${titleId}-window`}
                    onChange={() =>
                      onChange({ date: selectedDate, window: option.value })
                    }
                    type="radio"
                    value={option.value}
                  />
                  <span aria-hidden="true" className="pointer-events-none text-sm font-semibold leading-5">
                    {option.label}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none size-2 rounded-full ring-1 ring-current transition-colors",
                      selected && "bg-[var(--ink)]",
                    )}
                  />
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {error ? (
        <p
          className="mt-4 rounded-lg bg-[color-mix(in_oklch,var(--danger)_22%,transparent)] px-3 py-2 text-sm font-semibold text-[var(--limestone)] ring-1 ring-[color-mix(in_oklch,var(--danger)_58%,transparent)]"
          id={describedBy}
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
});

ConsultationCalendar.displayName = "ConsultationCalendar";
