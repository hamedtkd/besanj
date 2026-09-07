"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

/** PersianLabs/ui Select: portaled popup keeps the trigger's RTL direction. */
const SelectDirContext = React.createContext<{
  dir: "ltr" | "rtl";
  setDir: (dir: "ltr" | "rtl") => void;
}>({ dir: "ltr", setDir: () => {} });

function Select<Value, Multiple extends boolean | undefined = false>({
  ...props
}: SelectPrimitive.Root.Props<Value, Multiple>) {
  const [dir, setDir] = React.useState<"ltr" | "rtl">("ltr");
  const contextValue = React.useMemo(() => ({ dir, setDir }), [dir]);
  return (
    <SelectDirContext.Provider value={contextValue}>
      <SelectPrimitive.Root data-slot="select" {...props} />
    </SelectDirContext.Provider>
  );
}

function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const { setDir } = React.useContext(SelectDirContext);

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
    <SelectPrimitive.Trigger
      ref={ref}
      data-slot="select-trigger"
      className={cn(
        "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:opacity-50 data-[placeholder]:text-muted-foreground data-[popup-open]:border-ring dark:bg-input/20",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="flex shrink-0 items-center justify-center text-muted-foreground">
        <ChevronDownIcon className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectValue({ className, ...props }: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("min-w-0 truncate", className)}
      {...props}
    />
  );
}

function SelectContent({
  className,
  sideOffset = 6,
  children,
  finalFocus,
  ...props
}: SelectPrimitive.Positioner.Props & {
  sideOffset?: number;
  finalFocus?: SelectPrimitive.Popup.Props["finalFocus"];
}) {
  const { dir } = React.useContext(SelectDirContext);
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner
        dir={dir}
        data-slot="select-positioner"
        sideOffset={sideOffset}
        className="z-[100] outline-none"
        alignItemWithTrigger={false}
        {...props}
      >
        <SelectPrimitive.Popup
          data-slot="select-content"
          finalFocus={finalFocus}
          className={cn(
            "max-h-72 w-[var(--anchor-width)] min-w-44 origin-[var(--transform-origin)] overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
        >
          <SelectPrimitive.List>{children}</SelectPrimitive.List>
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex cursor-default items-center gap-2 rounded-lg py-2 ps-8 pe-2.5 text-sm text-muted-foreground outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-muted data-[highlighted]:text-foreground data-[selected]:text-foreground",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemIndicator className="absolute start-2.5 inline-flex items-center justify-center">
        <CheckIcon className="size-3.5" />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

function SelectGroup(props: SelectPrimitive.Group.Props) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

function SelectGroupLabel({
  className,
  ...props
}: SelectPrimitive.GroupLabel.Props) {
  return (
    <SelectPrimitive.GroupLabel
      data-slot="select-group-label"
      className={cn("px-2.5 py-1.5 text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.Separator.Props) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectGroupLabel,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
