"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DRAG_CLOSE_MIN_PX = 76;
const DRAG_CLOSE_RATIO = 0.17;

export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  layerClassName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  layerClassName?: string;
}) {
  const contentRef = React.useRef<HTMLElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const dragPointer = React.useRef<number | null>(null);
  const startY = React.useRef(0);
  const dragYRef = React.useRef(0);
  const [dragY, setDragY] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);

  function setDrag(value: number) {
    const next = Math.max(0, value);
    dragYRef.current = next;
    setDragY(next);
  }

  function beginDrag(event: React.PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragPointer.current = event.pointerId;
    startY.current = event.clientY;
    setDrag(0);
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function moveDrag(event: React.PointerEvent<HTMLButtonElement>) {
    if (dragPointer.current !== event.pointerId) return;
    setDrag(event.clientY - startY.current);
  }

  function finishDrag(
    event: React.PointerEvent<HTMLButtonElement>,
    cancelled = false
  ) {
    if (dragPointer.current !== event.pointerId) return;

    const completedDragY = dragYRef.current;
    dragPointer.current = null;
    try {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
    setDragging(false);

    if (cancelled) {
      setDrag(0);
      return;
    }

    const height = contentRef.current?.getBoundingClientRect().height ?? 0;
    const threshold = Math.max(DRAG_CLOSE_MIN_PX, height * DRAG_CLOSE_RATIO);
    if (completedDragY >= threshold) {
      onOpenChange(false);
      window.setTimeout(() => setDrag(0), 180);
      return;
    }

    setDrag(0);
  }

  const clientReady = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  React.useEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0;
    });
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.body.style.overflow = before;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!clientReady || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <div className={cn("fixed inset-0 z-[70]", layerClassName)} data-responsive-sheet-root>
          <motion.button
            type="button"
            aria-label="بستن"
            className="absolute inset-0 bg-black/55 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: Math.max(0.55, 1 - dragY / 900) }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />

          <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-0 sm:items-center sm:p-5">
            <motion.div
              className="pointer-events-auto w-full sm:max-w-xl"
              initial={{ y: 38, opacity: 0, scale: 0.985 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 34, opacity: 0, scale: 0.985 }}
              transition={{ type: "spring", damping: 30, stiffness: 360 }}
            >
              <section
                ref={contentRef}
                role="dialog"
                aria-modal="true"
                aria-label={title}
                data-dragging={dragging ? "true" : "false"}
                style={{
                  transform: `translateY(${dragY}px)`,
                  transition: dragging
                    ? "none"
                    : "transform 200ms cubic-bezier(.2,.8,.2,1)",
                }}
                className={cn(
                  "flex max-h-[92svh] w-full flex-col overflow-hidden rounded-t-[30px] border border-border bg-popover text-popover-foreground shadow-2xl will-change-transform sm:max-h-[min(88svh,46rem)] sm:rounded-3xl",
                  className
                )}
              >
                <button
                  type="button"
                  className="-mb-1 flex h-9 w-full shrink-0 cursor-grab touch-none select-none items-center justify-center active:cursor-grabbing sm:hidden"
                  onPointerDown={beginDrag}
                  onPointerMove={moveDrag}
                  onPointerUp={(event) => finishDrag(event)}
                  onPointerCancel={(event) => finishDrag(event, true)}
                  onLostPointerCapture={() => {
                    if (dragPointer.current !== null) {
                      dragPointer.current = null;
                      setDragging(false);
                      setDrag(0);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    onOpenChange(false);
                  }}
                  aria-label="بستن پنجره؛ به پایین بکشید"
                >
                  <span
                    className={cn(
                      "h-1.5 rounded-full bg-muted-foreground/35 transition-[width,background-color]",
                      dragging ? "w-16 bg-muted-foreground/55" : "w-12"
                    )}
                  />
                </button>

                <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
                  <div className="min-w-0">
                    <h2 className="type-section-title">{title}</h2>
                    {description ? (
                      <p className="type-caption mt-1 text-muted-foreground">
                        {description}
                      </p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="بستن"
                    onClick={() => onOpenChange(false)}
                  >
                    <X />
                  </Button>
                </header>

                <div
                  ref={scrollRef}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]"
                >
                  {children}
                </div>
              </section>
            </motion.div>
          </div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
