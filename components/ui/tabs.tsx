"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva } from "class-variance-authority";
import { motion } from "motion/react";
import * as React from "react";
import { cn } from "@/lib/utils";

/** PersianLabs/ui Tabs, lightly trimmed for the variants used in this app. */
const tabsListVariants = cva(
  "relative inline-flex items-center data-[orientation=vertical]:flex-col",
  {
    variants: {
      variant: {
        default: "w-fit gap-1 rounded-xl bg-muted p-1 text-muted-foreground",
        line: "w-full gap-5 border-b border-border text-muted-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const tabsTriggerVariants = cva(
  "relative z-10 inline-flex h-8 items-center justify-center gap-1.5 px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "rounded-lg text-muted-foreground data-[active]:text-primary-foreground",
        line: "h-10 rounded-none px-1 pb-3 text-muted-foreground data-[active]:text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

type TabsVariant = "default" | "line";

const TabsContext = React.createContext<{
  activeValue: unknown;
  variant: TabsVariant;
} | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used inside Tabs.");
  return context;
}

interface TabsProps extends TabsPrimitive.Root.Props {
  variant?: TabsVariant;
}

function Tabs({
  className,
  defaultValue,
  value,
  onValueChange,
  variant = "default",
  ...props
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(
    defaultValue ?? null
  );
  const activeValue = value !== undefined ? value : uncontrolledValue;

  return (
    <TabsContext.Provider value={{ activeValue, variant }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        className={cn("flex flex-col gap-4", className)}
        defaultValue={defaultValue}
        value={value}
        onValueChange={(next, details) => {
          setUncontrolledValue(next);
          onValueChange?.(next, details);
        }}
        {...props}
      />
    </TabsContext.Provider>
  );
}

function TabsList({ className, children, ...props }: TabsPrimitive.List.Props) {
  const { activeValue, variant } = useTabsContext();
  const listRef = React.useRef<HTMLDivElement>(null);
  const [rect, setRect] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  React.useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;

    function measure() {
      const activeTrigger = list?.querySelector<HTMLElement>(
        '[data-slot="tabs-trigger"][data-active]'
      );
      if (!activeTrigger) return setRect(null);
      if (variant === "line") {
        setRect({
          x: activeTrigger.offsetLeft,
          y: activeTrigger.offsetTop + activeTrigger.offsetHeight - 2,
          width: activeTrigger.offsetWidth,
          height: 2,
        });
      } else {
        setRect({
          x: activeTrigger.offsetLeft,
          y: activeTrigger.offsetTop,
          width: activeTrigger.offsetWidth,
          height: activeTrigger.offsetHeight,
        });
      }
    }

    measure();
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(list);
    return () => resizeObserver.disconnect();
  }, [activeValue, variant]);

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    >
      {rect && (
        <motion.span
          aria-hidden
          className={cn(
            "absolute top-0 left-0",
            variant === "line" ? "bg-primary" : "bg-primary shadow-sm"
          )}
          style={{ borderRadius: variant === "line" ? 2 : 8 }}
          initial={false}
          animate={{
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          }}
          transition={{ type: "spring", bounce: 0.15, duration: 0.3 }}
        />
      )}
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, value, ...props }: TabsPrimitive.Tab.Props) {
  const { variant } = useTabsContext();
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      value={value}
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...props}
    />
  );
}

function TabsContent({
  className,
  children,
  ...props
}: Omit<TabsPrimitive.Panel.Props, "className"> & { className?: string }) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className="focus-visible:outline-none"
      {...props}
    >
      <motion.div
        className={className}
        initial={{ opacity: 0.7, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.14, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </TabsPrimitive.Panel>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
