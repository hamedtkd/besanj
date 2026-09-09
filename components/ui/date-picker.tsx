"use client";

import * as React from "react";
import {
  DoranDate,
  faIR,
  toDoranDate,
} from "@doranjs/core";
import {
  buildMonthGrid,
  CalendarHeader,
  MonthYearPanel,
  navigateFocus,
  useCalendar,
  type CalendarPanel,
  type GridNav,
} from "@doranjs/react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toPersianDigits } from "@/lib/persian-number";
import { cn } from "@/lib/utils";

export type DatePickerPresentation = "auto" | "popover" | "drawer";
export type DatePickerConfirmMode = "auto" | "immediate" | "explicit";
export type DatePickerDefaultValue = Date | "today" | null;

export interface DatePickerPreset {
  label: string;
  value: Date;
}

export interface DatePickerProps {
  value?: Date | null;
  defaultValue?: DatePickerDefaultValue;
  onValueChange?: (value: Date | null) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  presentation?: DatePickerPresentation;
  mobileBreakpoint?: number;
  confirmMode?: DatePickerConfirmMode;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  contentClassName?: string;
  drawerTitle?: string;
  min?: Date | null;
  max?: Date | null;
  quickPresets?: readonly DatePickerPreset[];
}

function resolveStaticDate(value: DatePickerDefaultValue | undefined) {
  return value instanceof Date ? value : null;
}

function toPersianDateLabel(value: Date | null) {
  if (!value) return null;
  return toPersianDigits(DoranDate.fromGregorian(value).withLocale(faIR).format("YYYY/MM/DD"));
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

/**
 * Jalali DatePicker powered by Doran's calendar engine, styled with this app's
 * own PersianLabs-like primitives. Desktop uses a popover; mobile uses our
 * drag-to-dismiss bottom sheet.
 */
function DatePicker({
  value: valueProp,
  defaultValue = null,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  presentation = "auto",
  mobileBreakpoint = 640,
  confirmMode = "auto",
  placeholder = "انتخاب تاریخ",
  confirmLabel = "تأیید",
  cancelLabel = "انصراف",
  disabled,
  clearable = false,
  className,
  contentClassName,
  drawerTitle,
  min,
  max,
  quickPresets = [],
}: DatePickerProps) {
  const isControlled = valueProp !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState<Date | null>(
    resolveStaticDate(defaultValue)
  );
  const value = isControlled ? valueProp : uncontrolledValue;
  const [draft, setDraft] = React.useState<Date | null>(value);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const open = openProp ?? uncontrolledOpen;

  React.useEffect(() => {
    if (defaultValue !== "today" || isControlled) return;
    const init = () =>
      setUncontrolledValue((current) => current ?? new Date());
    init();
  }, [defaultValue, isControlled]);
  const matchesMobile = useMediaQuery({ max: mobileBreakpoint });
  const isDrawer =
    presentation === "drawer" ||
    (presentation === "auto" && matchesMobile);
  const resolvedConfirmMode =
    confirmMode === "auto"
      ? isDrawer
        ? "explicit"
        : "immediate"
      : confirmMode;

  function setOpen(next: boolean) {
    if (openProp === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
    if (next) setDraft(value);
  }

  function commit(next: Date | null) {
    if (!isControlled) setUncontrolledValue(next);
    onValueChange?.(next);
  }

  function handleSelectedDate(next: DoranDate | null) {
    if (!next) return;
    const gregorian = next.toGregorian();
    setDraft(gregorian);

    if (resolvedConfirmMode === "immediate") {
      commit(gregorian);
      setOpen(false);
    }
  }

  function apply() {
    commit(draft);
    setOpen(false);
  }

  function cancel() {
    setDraft(value);
    setOpen(false);
  }

  function clear() {
    setDraft(null);
    commit(null);
    setOpen(false);
  }

  function choosePreset(next: Date) {
    const doran = toDoranDate(next);
    if (!doran) return;
    setDraft(next);
    if (resolvedConfirmMode === "immediate") {
      commit(next);
      setOpen(false);
    }
  }

  const formattedValue = toPersianDateLabel(value);

  const trigger = (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      onClick={isDrawer ? () => setOpen(true) : undefined}
      className={cn(
        "h-10 w-full justify-start gap-2 rounded-xl px-3 font-normal",
        !formattedValue && "text-muted-foreground",
        className
      )}
    >
      <CalendarIcon className="size-4 shrink-0" />
      <span className="type-data truncate">
        {formattedValue ?? placeholder}
      </span>
    </Button>
  );

  const calendar = (
    <DoranCalendarSurface
      value={draft}
      min={min}
      max={max}
      onChange={handleSelectedDate}
      className={contentClassName}
    />
  );

  const presetRow = quickPresets.length ? (
    <div className="border-b border-border px-3 pb-3">
      <div className="type-caption mb-2 text-muted-foreground">انتخاب سریع</div>
      <div className="flex max-w-full flex-wrap gap-1.5">
        {quickPresets.map((preset) => {
          const active = draft ? isSameDay(draft, preset.value) : false;
          return (
            <Button
              key={`${preset.label}-${preset.value.getTime()}`}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => choosePreset(preset.value)}
            >
              {preset.label}
            </Button>
          );
        })}
      </div>
    </div>
  ) : null;

  if (isDrawer) {
    return (
      <>
        {trigger}
        <ResponsiveSheet
          open={open}
          onOpenChange={setOpen}
          title={drawerTitle ?? placeholder}
          description="تاریخ را از تقویم شمسی انتخاب کن."
          className="sm:max-w-md"
          layerClassName="z-[120]"
        >
          <div className="p-3 pt-4">
            {presetRow}
            <div className="flex justify-center pt-3">{calendar}</div>
          </div>
          <div className="safe-bottom grid grid-cols-2 gap-2 border-t border-border bg-popover/95 p-4 backdrop-blur">
            <Button type="button" variant="outline" onClick={cancel}>
              {cancelLabel}
            </Button>
            <Button
              type="button"
              disabled={!draft}
              onClick={apply}
            >
              {confirmLabel}
            </Button>
            {clearable && value ? (
              <Button
                type="button"
                variant="ghost"
                className="col-span-2"
                onClick={clear}
              >
                پاک کردن تاریخ
              </Button>
            ) : null}
          </div>
        </ResponsiveSheet>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent
        className="w-auto max-w-[calc(100vw-2rem)] p-0"
        align="start"
      >
        <div className="pt-3">
          {presetRow}
          <div className="p-3">{calendar}</div>
        </div>
        {resolvedConfirmMode === "explicit" || (clearable && value) ? (
          <div className="flex justify-end gap-2 border-t border-border p-3">
            {resolvedConfirmMode === "explicit" ? (
              <Button type="button" size="sm" variant="outline" onClick={cancel}>
                {cancelLabel}
              </Button>
            ) : null}
            {clearable && value ? (
              <Button type="button" size="sm" variant="ghost" onClick={clear}>
                پاک کردن
              </Button>
            ) : null}
            {resolvedConfirmMode === "explicit" ? (
              <Button type="button" size="sm" disabled={!draft} onClick={apply}>
                {confirmLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

function DoranCalendarSurface({
  value,
  min,
  max,
  onChange,
  className,
}: {
  value: Date | null;
  min?: Date | null;
  max?: Date | null;
  onChange: (value: DoranDate | null) => void;
  className?: string;
}) {
  const selected = toDoranDate(value);
  const minDate = toDoranDate(min ?? undefined);
  const maxDate = toDoranDate(max ?? undefined);

  const calendar = useCalendar({
    value: selected,
    onChange,
    ...(minDate ? { min: minDate } : {}),
    ...(maxDate ? { max: maxDate } : {}),
  });

  const [focusDate, setFocusDate] = React.useState<DoranDate | null>(null);
  const active = focusDate ?? selected ?? calendar.today;
  const gridRef = React.useRef<HTMLDivElement>(null);

  const selectedYear = selected?.year;
  const selectedMonth = selected?.month;
  const setCalendarMonth = calendar.setMonth;
  const [panel, setPanel] = React.useState<CalendarPanel>("days");

  // Sync the visible month only when the selected value changes from outside.
  // Do NOT depend on calendar.year/month here: doing so would immediately snap
  // the calendar back after pressing the previous/next month arrows.
  React.useEffect(() => {
    if (selectedYear === undefined || selectedMonth === undefined) return;
    setCalendarMonth({ year: selectedYear, month: selectedMonth });
  }, [selectedYear, selectedMonth, setCalendarMonth]);

  const yearRange = React.useMemo<[number, number]>(() => {
    const fallbackStart = calendar.year - 30;
    const fallbackEnd = calendar.year + 30;
    const start = minDate?.year ?? fallbackStart;
    const end = maxDate?.year ?? fallbackEnd;
    return start <= end ? [start, end] : [end, start];
  }, [calendar.year, minDate?.year, maxDate?.year]);

  function togglePanel(next: Exclude<CalendarPanel, "days">) {
    setPanel((current) => (current === next ? "days" : next));
  }

  function selectMonth(month: number) {
    setCalendarMonth({ year: calendar.year, month });
    setFocusDate(null);
    setPanel("days");
  }

  function selectYear(year: number) {
    setCalendarMonth({ year, month: calendar.month });
    setFocusDate(null);
    setPanel("days");
  }

  function move(nav: GridNav) {
    let target = navigateFocus(active, nav);
    let guard = 0;

    while (calendar.isDisabled(target) && guard < 366) {
      target = target.addDays(nav.startsWith("prev") ? -1 : 1);
      guard += 1;
    }

    setFocusDate(target);
    if (target.year !== calendar.year || target.month !== calendar.month) {
      calendar.setMonth({ year: target.year, month: target.month });
    }

    window.requestAnimationFrame(() => {
      const key = `${target.year}-${target.month}-${target.day}`;
      gridRef.current
        ?.querySelector<HTMLElement>(`[data-day="${key}"]`)
        ?.focus();
    });
  }

  function onGridKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const moves: Record<string, GridNav> = {
      ArrowLeft: "next-day",
      ArrowRight: "prev-day",
      ArrowUp: "prev-week",
      ArrowDown: "next-week",
      Home: "week-start",
      End: "week-end",
      PageUp: event.shiftKey ? "prev-year" : "prev-month",
      PageDown: event.shiftKey ? "next-year" : "next-month",
    };

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!calendar.isDisabled(active)) calendar.select(active);
      return;
    }

    const nav = moves[event.key];
    if (!nav) return;
    event.preventDefault();
    move(nav);
  }

  const grid = buildMonthGrid(calendar.year, calendar.month, {
    today: calendar.today,
  });
  const heading = DoranDate.fromJalali({
    year: calendar.year,
    month: calendar.month,
    day: 1,
  });
  const monthLabel = toPersianDigits(heading.withLocale(faIR).format("MMMM YYYY"));
  const num = (value: number) => faIR.formatNumber(String(value));

  return (
    <div
      className={cn(
        "besanj-doran w-[min(100%,21.5rem)] rounded-2xl border border-border/80 bg-popover p-2 text-popover-foreground shadow-sm",
        className
      )}
      dir="rtl"
    >
      <CalendarHeader
          year={calendar.year}
          month={calendar.month}
          locale={faIR}
          mode="dropdown"
          panel={panel}
          onPrevMonth={() => {
            setPanel("days");
            calendar.goToPrevMonth();
          }}
          onNextMonth={() => {
            setPanel("days");
            calendar.goToNextMonth();
          }}
          onTogglePanel={togglePanel}
          onSelectMonth={selectMonth}
          onSelectYear={selectYear}
          yearRange={yearRange}
          direction="rtl"
          arrows={{
            prev: <ChevronRight className="size-4" />,
            next: <ChevronLeft className="size-4" />,
          }}
        />

      {panel === "days" ? (
        <div
          ref={gridRef}
          role="grid"
          aria-label={monthLabel}
          onKeyDown={onGridKeyDown}
        >
        <div role="row" className="grid grid-cols-7">
          {faIR.weekdaysMin.map((day, index) => (
            <div
              key={`${day}-${index}`}
              role="columnheader"
              className="type-caption py-1.5 text-center text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {grid.weeks.map((week, weekIndex) => (
          <div key={weekIndex} role="row" className="grid grid-cols-7">
            {week.map((cell) => {
              const isSelected = calendar.isSelected(cell.date);
              const isDisabled = calendar.isDisabled(cell.date);
              const isActive = cell.date.isSame(active, "day");
              const key = `${cell.year}-${cell.month}-${cell.day}`;

              return (
                <div
                  key={key}
                  role="gridcell"
                  aria-selected={isSelected}
                  className="p-0.5"
                >
                  <button
                    type="button"
                    data-day={key}
                    tabIndex={isActive ? 0 : -1}
                    aria-disabled={isDisabled || undefined}
                    aria-current={cell.isToday ? "date" : undefined}
                    aria-label={toPersianDigits(
                      cell.date.withLocale(faIR).format("dddd D MMMM YYYY")
                    )}
                    onClick={() => {
                      if (isDisabled) return;
                      setFocusDate(cell.date);
                      calendar.select(cell.date);
                    }}
                    className={cn(
                      "relative grid size-9 place-items-center rounded-xl text-sm transition-colors outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      !cell.inCurrentMonth && "text-muted-foreground/40",
                      cell.isToday &&
                        !isSelected &&
                        "bg-primary/[0.08] font-medium text-primary",
                      isSelected
                        ? "bg-primary font-medium text-primary-foreground shadow-sm"
                        : !isDisabled &&
                            "hover:bg-muted hover:text-foreground",
                      isDisabled &&
                        "cursor-not-allowed text-muted-foreground/35 line-through"
                    )}
                  >
                    {num(cell.day)}
                    {cell.isToday && !isSelected ? (
                      <span className="absolute bottom-1 size-1 rounded-full bg-primary" />
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
        </div>
      ) : (
          <MonthYearPanel
            panel={panel}
            year={calendar.year}
            month={calendar.month}
            locale={faIR}
            yearRange={yearRange}
            onSelectMonth={selectMonth}
            onSelectYear={selectYear}
          />
      )}

      <div className="mt-2 flex justify-center border-t border-border pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setPanel("days");
            calendar.selectToday();
          }}
        >
          امروز
        </Button>
      </div>
    </div>
  );
}

export { DatePicker };
