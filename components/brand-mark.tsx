import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#1C7AFB]/25 bg-[#1C7AFB]/[0.08] shadow-sm dark:border-[#60A5FA]/25 dark:bg-[#1C7AFB]/[0.14]",
        className
      )}
    >
      <Image
        src="/brand/besanj.svg"
        alt=""
        width={20}
        height={28}
        priority
        className="h-7 w-auto"
      />
    </span>
  );
}
