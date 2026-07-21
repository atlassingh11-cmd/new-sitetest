"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight } from "@phosphor-icons/react";
import { AreaFinder } from "./area-finder";
import { BudgetCalculator } from "./budget-calculator";
import { OffPlanCheck } from "./off-plan-check";

const TOOLS = [
  { id: "area", label: "Area finder", component: AreaFinder },
  { id: "budget", label: "Budget calculator", component: BudgetCalculator },
  { id: "offplan", label: "Off-plan or ready", component: OffPlanCheck },
] as const;

function wrappedIndex(index: number) {
  return (index + TOOLS.length) % TOOLS.length;
}

export function AdvisoryTools() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const CurrentTool = TOOLS[active].component;

  function selectTool(index: number, focus = false) {
    const next = wrappedIndex(index);
    setActive(next);
    if (focus) {
      window.requestAnimationFrame(() => tabRefs.current[next]?.focus());
    }
  }

  function handleToolKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();
    if (event.key === "Home") return selectTool(0, true);
    if (event.key === "End") return selectTool(TOOLS.length - 1, true);
    const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
    selectTool(active + direction, true);
  }

  useEffect(() => {
    const requestedTool = new URLSearchParams(window.location.search).get("tool");
    const requestedIndex = TOOLS.findIndex((tool) => tool.id === requestedTool);
    if (requestedIndex < 0) return;
    const timer = window.setTimeout(() => setActive(requestedIndex), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const updateStickyOffset = () => {
      section.style.setProperty(
        "--tool-sheet-height",
        `${section.getBoundingClientRect().height}px`,
      );
    };

    updateStickyOffset();
    if (typeof ResizeObserver !== "function") return;

    const observer = new ResizeObserver(updateStickyOffset);
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      aria-labelledby="tools-heading"
      className="tool-atmosphere bg-[var(--limestone)] py-12 text-[var(--ink)] sm:py-20 lg:py-24"
      data-scroll-chapter=""
      id="tools"
      ref={sectionRef}
      style={{ backgroundImage: "none" }}
    >
      <div className="mx-auto w-[min(100%-2rem,52rem)]">
        <header className="max-w-[46rem]">
          <h2
            className="text-balance text-[clamp(2.55rem,5.5vw,4.4rem)] font-medium leading-[0.96] tracking-[-0.05em]"
            id="tools-heading"
          >
            Make the first decision better.
          </h2>
        </header>

        <div
          aria-label="Choose a tool"
          aria-orientation="vertical"
          className="tool-stack mt-9 sm:mt-12"
          role="tablist"
        >
          {TOOLS.map((tool, index) => {
            const selected = index === active;

            return (
              <button
                aria-controls="active-advisory-tool"
                aria-selected={selected}
                className="tool-stack__card"
                data-active={selected ? "true" : "false"}
                id={`tool-tab-${tool.id}`}
                key={tool.id}
                onClick={() => selectTool(index)}
                onKeyDown={handleToolKeyDown}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                role="tab"
                tabIndex={selected ? 0 : -1}
                type="button"
              >
                <span aria-hidden="true" className="tool-stack__number">
                  0{index + 1}
                </span>
                <span className="tool-stack__label">{tool.label}</span>
                <ArrowRight
                  aria-hidden="true"
                  className="tool-stack__arrow"
                  size={24}
                  weight="regular"
                />
              </button>
            );
          })}
        </div>

        <div
          aria-labelledby={`tool-tab-${TOOLS[active].id}`}
          className="tool-panel mt-12 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[var(--gulf)] sm:mt-16"
          id="active-advisory-tool"
          key={TOOLS[active].id}
          role="tabpanel"
          tabIndex={0}
        >
          <CurrentTool />
        </div>
      </div>
    </section>
  );
}
