"use client";

import { parseDate } from "@internationalized/date";
import { DateField, DateRangePicker, Label, RangeCalendar } from "@heroui/react";
import { format, subDays } from "date-fns";
import { Loader2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardDateRangePickerProps = {
  startDate: string;
  endDate: string;
};

type PickerRangeValue = {
  start: { toString: () => string } | null;
  end: { toString: () => string } | null;
} | null;

function formatDateOnly(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function toHumanDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

export function DashboardDateRangePicker({ startDate, endDate }: DashboardDateRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const rangeValue = useMemo(
    () => ({
      start: parseDate(startDate),
      end: parseDate(endDate),
    }),
    [startDate, endDate],
  );

  const replaceRangeQuery = (nextStartDate: string, nextEndDate: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("startDate", nextStartDate);
    params.set("endDate", nextEndDate);

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const clearRangeQuery = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("startDate");
    params.delete("endDate");

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  const applyQuickRange = (days: number) => {
    const end = new Date();
    const start = subDays(end, days - 1);
    replaceRangeQuery(formatDateOnly(start), formatDateOnly(end));
  };

  const handleRangeChange = (nextValue: PickerRangeValue) => {
    if (!nextValue?.start || !nextValue.end) return;
    replaceRangeQuery(nextValue.start.toString(), nextValue.end.toString());
  };

  const scrollCurrentYearIntoView = useCallback(() => {
    const yearGrid = popoverRef.current?.querySelector<HTMLElement>("[data-dashboard-year-grid='true']");
    if (!yearGrid) return;

    const selectedYearCell = yearGrid.querySelector<HTMLElement>(
      "[data-selected='true'], [aria-selected='true'], [data-focused='true']",
    );
    if (selectedYearCell) {
      selectedYearCell.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    const activeYear = Number(endDate.slice(0, 4));
    if (!Number.isFinite(activeYear)) return;

    const fallbackCell = yearGrid.querySelector<HTMLElement>(`[data-year-value='${activeYear}']`);
    if (fallbackCell) {
      fallbackCell.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [endDate]);

  useEffect(() => {
    if (!isYearPickerOpen) return;

    const frameId = window.requestAnimationFrame(() => {
      window.setTimeout(scrollCurrentYearIntoView, 70);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isYearPickerOpen, scrollCurrentYearIntoView]);

  const today = new Date();
  const isSevenDays =
    startDate === formatDateOnly(subDays(today, 6)) && endDate === formatDateOnly(today);
  const isThirtyDays =
    startDate === formatDateOnly(subDays(today, 29)) && endDate === formatDateOnly(today);

  return (
    <div className="space-y-3">
      <DateRangePicker className="w-full max-w-[420px] gap-2" value={rangeValue} onChange={handleRangeChange}>
        <Label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8d6949]">Rentang Tanggal</Label>
        <DateField.Group
          fullWidth
          className="flex w-full items-center gap-2 rounded-2xl border border-[#e8c497] bg-[linear-gradient(145deg,#fffaf1_0%,#fff4e4_100%)] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] sm:py-2"
        >
          <DateField.InputContainer className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-2 py-1">
            <DateField.Input slot="start" className="min-w-0 whitespace-nowrap text-sm font-medium text-[#4b2f1f]">
              {(segment) => (
                <DateField.Segment
                  segment={segment}
                  className="rounded-md px-0.5 py-0.5 data-[type=literal]:text-[#a17859] data-[type=literal]:opacity-90"
                />
              )}
            </DateField.Input>
            <DateRangePicker.RangeSeparator className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#9b7150] whitespace-nowrap">
              s/d
            </DateRangePicker.RangeSeparator>
            <DateField.Input slot="end" className="min-w-0 whitespace-nowrap text-sm font-medium text-[#4b2f1f]">
              {(segment) => (
                <DateField.Segment
                  segment={segment}
                  className="rounded-md px-0.5 py-0.5 data-[type=literal]:text-[#a17859] data-[type=literal]:opacity-90"
                />
              )}
            </DateField.Input>
          </DateField.InputContainer>

          <DateField.Suffix className="ml-auto shrink-0 flex items-center pr-1">
            <DateRangePicker.Trigger className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#e4c094] bg-[#fff8ee] text-[#8a603f] transition hover:bg-[#ffeecf]">
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <DateRangePicker.TriggerIndicator />}
            </DateRangePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>

        <DateRangePicker.Popover
          ref={popoverRef}
          className="z-[70] w-[min(94vw,380px)] rounded-[22px] border border-[#e6c79f] bg-[linear-gradient(180deg,#fffaf2_0%,#ffefdb_100%)] p-3 shadow-[0_28px_56px_-30px_rgba(73,44,28,0.45)]"
        >
          <RangeCalendar
            aria-label="Pilih rentang tanggal"
            isYearPickerOpen={isYearPickerOpen}
            onYearPickerOpenChange={setIsYearPickerOpen}
            className="relative w-full rounded-xl border border-[#ecd0ad] bg-[rgba(255,255,255,0.38)] p-1"
          >
            <RangeCalendar.Header className="mb-2 flex items-center justify-between gap-2 px-1">
              <RangeCalendar.YearPickerTrigger
                className="inline-flex items-center gap-1 rounded-lg border border-transparent bg-transparent px-1 py-1 text-base font-semibold text-[#8a603f] transition hover:text-[#6f4a2f]"
              >
                <RangeCalendar.YearPickerTriggerHeading />
                <RangeCalendar.YearPickerTriggerIndicator />
              </RangeCalendar.YearPickerTrigger>

              <div className="flex items-center gap-1">
                <RangeCalendar.NavButton
                  slot="previous"
                  className="h-8 w-8 rounded-full border border-[#e5c59b] bg-[#fff5e7] text-[#8a603f] transition hover:bg-[#ffe9cb]"
                />
                <RangeCalendar.NavButton
                  slot="next"
                  className="h-8 w-8 rounded-full border border-[#e5c59b] bg-[#fff5e7] text-[#8a603f] transition hover:bg-[#ffe9cb]"
                />
              </div>
            </RangeCalendar.Header>

            <RangeCalendar.Grid
              className={cn("w-full transition-opacity duration-150", isYearPickerOpen && "pointer-events-none opacity-0")}
            >
              <RangeCalendar.GridHeader className="mb-1">
                {(day) => (
                  <RangeCalendar.HeaderCell className="pb-2 text-center text-sm font-semibold text-[#9a7759]">
                    {day}
                  </RangeCalendar.HeaderCell>
                )}
              </RangeCalendar.GridHeader>

              <RangeCalendar.GridBody>
                {(date) => (
                  <RangeCalendar.Cell
                    date={date}
                    className="mx-0 my-[2px] rounded-none p-0 transition data-[selected=true]:bg-[#f7ddb8] data-[selection-start=true]:rounded-l-full data-[selection-end=true]:rounded-r-full"
                  >
                    {(state) => {
                      const rangeState = state as typeof state & { isSelected?: boolean };
                      const inRange = Boolean(rangeState.isSelected || state.isSelectionStart || state.isSelectionEnd);

                      return (
                        <span
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full text-[18px] font-semibold transition",
                            state.isOutsideMonth ? "text-[#cfb49a]" : "text-[#4b2f1f]",
                            !inRange && (state.isHovered || state.isPressed) && "bg-[#ffeacf]",
                            state.isSelectionEnd && "bg-[#e6992f] text-white shadow-[0_0_0_1px_rgba(215,133,32,0.35)]",
                            state.isSelectionStart &&
                              "bg-[#e6992f] text-white ring-2 ring-[#f0c57f] ring-offset-2 ring-offset-[#fff5e8] shadow-[0_0_0_1px_rgba(215,133,32,0.35)]",
                            state.isDisabled && "opacity-40",
                          )}
                        >
                          {state.formattedDate}
                        </span>
                      );
                    }}
                  </RangeCalendar.Cell>
                )}
              </RangeCalendar.GridBody>
            </RangeCalendar.Grid>

            <RangeCalendar.YearPickerGrid
              data-dashboard-year-grid="true"
              className="absolute inset-x-1 bottom-1 top-[50px] z-20 max-h-none overflow-y-auto rounded-xl border border-[#e5c79d] bg-[#fff3e2] p-2 opacity-0 pointer-events-none transition-opacity duration-150 data-[open=true]:opacity-100 data-[open=true]:pointer-events-auto"
            >
              <RangeCalendar.YearPickerGridBody>
                {({ year }) => (
                  <RangeCalendar.YearPickerCell
                    data-year-value={year}
                    year={year}
                    className="rounded-xl border border-transparent px-2 py-2 text-center text-base font-semibold text-[#5b3a28] transition hover:bg-[#ffe9cc] data-[selected=true]:border-[#d8923f] data-[selected=true]:bg-[#efb14e] data-[selected=true]:text-[#3a2114]"
                  />
                )}
              </RangeCalendar.YearPickerGridBody>
            </RangeCalendar.YearPickerGrid>
          </RangeCalendar>
        </DateRangePicker.Popover>
      </DateRangePicker>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          className={cn("h-9 rounded-full px-3 text-xs", isSevenDays && "border-[#d78c2b] bg-[#ffe6bf] text-[#472b1c]")}
          onClick={() => applyQuickRange(7)}
          disabled={isPending}
        >
          7 Hari
        </Button>
        <Button
          variant="secondary"
          className={cn("h-9 rounded-full px-3 text-xs", isThirtyDays && "border-[#d78c2b] bg-[#ffe6bf] text-[#472b1c]")}
          onClick={() => applyQuickRange(30)}
          disabled={isPending}
        >
          30 Hari
        </Button>
        <Button variant="ghost" className="h-9 rounded-full px-3 text-xs" onClick={clearRangeQuery} disabled={isPending}>
          Reset
        </Button>

        <p className="text-xs text-[#7a5b43]">Aktif: {toHumanDate(startDate)} - {toHumanDate(endDate)}</p>
      </div>
    </div>
  );
}
