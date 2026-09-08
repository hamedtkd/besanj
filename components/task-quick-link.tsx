"use client";

import Link from "next/link";
import { BellRing } from "lucide-react";
import { useNotifications } from "@/components/notification-provider";
import { Button } from "@/components/ui/button";

export function TaskQuickLink() {
  const { tasks } = useNotifications();
  const count = tasks.length;
  const label = count
    ? `کارهای امروز، ${count.toLocaleString("fa-IR")} مورد`
    : "کارهای امروز";

  return (
    <Button
      nativeButton={false}
      render={<Link href="/#today-queue" />}
      variant="ghost"
      size="icon-sm"
      className="relative"
      aria-label={label}
      title={label}
    >
      <BellRing />
      {count ? (
        <span className="absolute -end-1 -top-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[.58rem] font-bold leading-4 text-white shadow-sm">
          {count > 9 ? "+۹" : count.toLocaleString("fa-IR")}
        </span>
      ) : null}
    </Button>
  );
}
