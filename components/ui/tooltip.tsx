"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Based on PersianLabs/ui Tooltip registry source.
 * https://github.com/persianlabs/ui/blob/208efb411fa25ed133e60e558f11777fdc717d3a/packages/ui/src/components/tooltip.tsx
 * Besanj only adjusts imports, punctuation and z-index to sit above ResponsiveSheet.
 */
function TooltipProvider({
  delay = 600,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  );
}

const TooltipDirContext = React.createContext<{
  dir: "ltr" | "rtl";
  setDir: (dir: "ltr" | "rtl") => void;
}>({ dir: "ltr", setDir: () => {} });

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  const [dir, setDir] = React.useState<"ltr" | "rtl">("ltr");
  const contextValue = React.useMemo(() => ({ dir, setDir }), [dir]);

  return (
    <TooltipDirContext.Provider value={contextValue}>
      <DirectionProvider direction={dir}>
        <TooltipPrimitive.Root data-slot="tooltip" {...props} />
      </DirectionProvider>
    </TooltipDirContext.Provider>
  );
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const { setDir } = React.useContext(TooltipDirContext);

  React.useEffect(() => {
    function update() {
      if (!ref.current) return;
      setDir(getComputedStyle(ref.current).direction === "rtl" ? "rtl" : "ltr");
    }

    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir"],
      subtree: true,
    });

    return () => observer.disconnect();
  }, [setDir]);

  return (
    <TooltipPrimitive.Trigger
      ref={ref}
      data-slot="tooltip-trigger"
      {...props}
    />
  );
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 6,
  align = "center",
  alignOffset = 0,
  showArrow = true,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & {
    showArrow?: boolean;
  }) {
  const { dir } = React.useContext(TooltipDirContext);

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        dir={dir}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-[90]"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          dir={dir}
          className={cn(
            "z-[90] inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 pt-1.5 pb-2 text-xs leading-5 text-background shadow-lg has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
          {showArrow ? (
            <TooltipPrimitive.Arrow className="z-[90] size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5 rtl:data-[side=inline-end]:-right-1 rtl:data-[side=inline-end]:left-auto rtl:data-[side=inline-start]:right-auto rtl:data-[side=inline-start]:-left-1" />
          ) : null}
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
