import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ConsultationCalendar,
  focusConsultationDateControl,
  getDubaiPreferenceBounds,
  isValidDubaiPreferenceDate,
  type ConsultationPreference,
} from "@/components/ui/consultation-calendar";

const NOW = new Date("2026-07-12T12:00:00.000Z");

function installMatchMedia(isNarrow = false) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: query.includes("max-width: 359px") ? isNarrow : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function CalendarHarness({
  initial = {},
  onValue,
}: {
  initial?: ConsultationPreference;
  onValue?: (value: ConsultationPreference) => void;
}) {
  const [value, setValue] = React.useState(initial);
  return (
    <div data-testid="calendar-root">
      <ConsultationCalendar
        onChange={(next) => {
          setValue(next);
          onValue?.(next);
        }}
        value={value}
      />
      <output>{JSON.stringify(value)}</output>
    </div>
  );
}

describe("ConsultationCalendar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    installMatchMedia();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses Dubai calendar days and accepts only tomorrow through day sixty", () => {
    const bounds = getDubaiPreferenceBounds(NOW);
    expect(bounds).toEqual({ min: "2026-07-13", max: "2026-09-10" });
    expect(isValidDubaiPreferenceDate("2026-07-12", NOW)).toBe(false);
    expect(isValidDubaiPreferenceDate("2026-07-13", NOW)).toBe(true);
    expect(isValidDubaiPreferenceDate("2026-09-10", NOW)).toBe(true);
    expect(isValidDubaiPreferenceDate("2026-09-11", NOW)).toBe(false);
    expect(isValidDubaiPreferenceDate("2026-02-30", NOW)).toBe(false);
  });

  it("keeps server HTML clock-neutral until live bounds hydrate", () => {
    const renderServerCalendar = () =>
      renderToStaticMarkup(
        <ConsultationCalendar onChange={() => undefined} value={{}} />,
      );

    const firstHtml = renderServerCalendar();
    vi.setSystemTime(new Date("2031-01-04T23:59:59.000Z"));
    const laterHtml = renderServerCalendar();

    expect(laterHtml).toBe(firstHtml);
    expect(firstHtml).toContain('type="date"');
    expect(firstHtml).not.toContain('role="grid"');
    expect(firstHtml).not.toMatch(/\s(?:min|max)="\d{4}-\d{2}-\d{2}"/);
  });

  it("selects an available day and enables the exact Dubai time windows", () => {
    const onValue = vi.fn();
    render(<CalendarHarness onValue={onValue} />);

    const tomorrow = screen.getByRole("button", {
      name: "Monday, 13 July 2026",
    });
    fireEvent.click(tomorrow);

    expect(onValue).toHaveBeenLastCalledWith({ date: "2026-07-13" });
    const morning = screen.getByRole("radio", {
      name: "Morning, 9am to 12pm",
    });
    expect(morning).toBeEnabled();
    fireEvent.click(morning);
    expect(onValue).toHaveBeenLastCalledWith({
      date: "2026-07-13",
      window: "morning",
    });
  });

  it("uses one translucent glass surface and full-width time rows", () => {
    render(<CalendarHarness initial={{ date: "2026-07-13" }} />);

    const calendar = screen.getByRole("group", { name: "Preferred day" });
    expect(calendar).toHaveClass("border-white/10", "bg-black/20", "backdrop-blur-xl");

    const morning = screen.getByRole("radio", {
      name: "Morning, 9am to 12pm",
    });
    expect(morning.closest("label")).toHaveClass("border-b");
    expect(morning.closest("label")).not.toHaveClass("rounded-full");
  });

  it("prevents a window-only preference and clears the window with the date", () => {
    const onValue = vi.fn();
    const { rerender } = render(
      <ConsultationCalendar
        onChange={onValue}
        value={{ window: "morning" }}
      />,
    );
    expect(
      screen.queryByRole("radio", { name: "Morning, 9am to 12pm" }),
    ).not.toBeInTheDocument();

    rerender(
      <ConsultationCalendar
        onChange={onValue}
        value={{ date: "2026-07-13", window: "evening" }}
      />,
    );
    expect(
      screen.getByRole("radio", { name: "Evening, 4pm to 7pm" }),
    ).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Clear day" }));
    expect(onValue).toHaveBeenLastCalledWith({});
  });

  it("implements roving arrow, week, and month keyboard navigation", () => {
    render(<CalendarHarness />);
    const first = document.querySelector<HTMLElement>("[data-date-input]");
    expect(first).toHaveAccessibleName("Monday, 13 July 2026");

    first?.focus();
    fireEvent.keyDown(first as HTMLElement, { key: "ArrowRight" });
    expect(document.activeElement).toHaveAccessibleName(
      "Tuesday, 14 July 2026",
    );

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "End" });
    expect(document.activeElement).toHaveAccessibleName(
      "Sunday, 19 July 2026",
    );

    fireEvent.keyDown(document.activeElement as HTMLElement, {
      key: "PageDown",
    });
    expect(screen.getByText("August 2026")).toBeVisible();
    expect(document.activeElement).toHaveAccessibleName(
      "Wednesday, 19 August 2026",
    );
  });

  it("keeps the glass day rail at narrow client widths", () => {
    installMatchMedia(true);
    render(<CalendarHarness />);

    expect(
      screen.queryByLabelText("Preferred day in Dubai"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("grid")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Monday, 13 July 2026" }),
    ).toHaveAttribute("data-date-input");
  });

  it("refreshes at Dubai midnight and clamps the roving focus target", () => {
    const { container } = render(<CalendarHarness />);
    expect(document.querySelector("[data-date-input]")).toHaveAccessibleName(
      "Monday, 13 July 2026",
    );

    act(() => {
      vi.advanceTimersByTime(8 * 60 * 60 * 1_000 + 100);
    });

    const liveTarget = document.querySelector<HTMLElement>("[data-date-input]");
    expect(liveTarget).toHaveAccessibleName("Tuesday, 14 July 2026");
    expect(liveTarget).toBeEnabled();
    expect(liveTarget).toHaveAttribute("tabindex", "0");
    expect(focusConsultationDateControl(container)).toBe(true);
    expect(document.activeElement).toBe(liveTarget);
  });

  it("exposes a focus helper and associates validation errors", () => {
    const { container } = render(
      <ConsultationCalendar
        error="Choose a new preferred day."
        errorId="date-error"
        onChange={() => undefined}
        value={{}}
      />,
    );

    expect(focusConsultationDateControl(container)).toBe(true);
    expect(document.activeElement).toHaveAttribute("data-date-input");
    expect(screen.getByText("Choose a new preferred day.")).toHaveAttribute(
      "id",
      "date-error",
    );
  });
});
