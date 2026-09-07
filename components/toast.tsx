"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ToastKind = "success" | "error";
type ToastItem = {
  id: string;
  title: string;
  kind: ToastKind;
};

const ToastContext = React.createContext<{
  toast: (title: string, kind?: ToastKind) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((title: string, kind: ToastKind = "success") => {
    const id = crypto.randomUUID();
    setItems((current) => [...current, { id, title, kind }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-4 z-[100] mx-auto flex max-w-md flex-col gap-2 safe-bottom">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              key={item.id}
              className="glass pointer-events-auto flex items-center gap-2 rounded-2xl px-3 py-2.5"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
            >
              {item.kind === "success" ? (
                <CheckCircle2 className="size-5 shrink-0 text-profit" />
              ) : (
                <CircleAlert className="size-5 shrink-0 text-destructive" />
              )}
              <span className="type-body flex-1">{item.title}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="بستن پیام"
                onClick={() =>
                  setItems((current) => current.filter((x) => x.id !== item.id))
                }
              >
                <X />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = React.useContext(ToastContext);
  if (!value) throw new Error("useToast must be used inside ToastProvider.");
  return value;
}
