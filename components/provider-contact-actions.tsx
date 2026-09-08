"use client";

import { Copy, MessageCircle, MessageSquareText, Phone } from "lucide-react";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { buildProviderContactLinks } from "@/lib/contact";
import type { Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProviderContactActions({
  provider,
  message,
  compact = false,
  className,
}: {
  provider: Pick<Provider, "name" | "phone">;
  message: string;
  compact?: boolean;
  className?: string;
}) {
  const { toast } = useToast();
  const links = buildProviderContactLinks(provider.phone, message);
  const hasDirectContact = Boolean(
    links.callHref || links.smsHref || links.whatsappHref
  );

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      toast("متن پیگیری کپی شد.");
    } catch {
      toast("کپی متن انجام نشد.", "error");
    }
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {links.callHref ? (
        <Button
          nativeButton={false}
          render={<a href={links.callHref} />}
          variant="ghost"
          size={compact ? "icon-sm" : "sm"}
          aria-label={`تماس با ${provider.name}`}
          title={`تماس با ${provider.name}`}
        >
          <Phone />
          {compact ? null : "تماس"}
        </Button>
      ) : null}

      {links.whatsappHref ? (
        <Button
          nativeButton={false}
          render={
            <a
              href={links.whatsappHref}
              target="_blank"
              rel="noreferrer"
            />
          }
          variant="ghost"
          size={compact ? "icon-sm" : "sm"}
          aria-label={`واتساپ ${provider.name}`}
          title={`واتساپ ${provider.name}`}
        >
          <MessageCircle />
          {compact ? null : "واتساپ"}
        </Button>
      ) : null}

      {links.smsHref ? (
        <Button
          nativeButton={false}
          render={<a href={links.smsHref} />}
          variant="ghost"
          size={compact ? "icon-sm" : "sm"}
          aria-label={`پیامک به ${provider.name}`}
          title={`پیامک به ${provider.name}`}
        >
          <MessageSquareText />
          {compact ? null : "پیامک"}
        </Button>
      ) : null}

      <Button
        type="button"
        variant={hasDirectContact ? "ghost" : "outline"}
        size={compact ? "icon-sm" : "sm"}
        onClick={() => void copyMessage()}
        aria-label={`کپی متن پیگیری ${provider.name}`}
        title="کپی متن پیگیری"
      >
        <Copy />
        {compact ? null : "کپی متن"}
      </Button>
    </div>
  );
}
