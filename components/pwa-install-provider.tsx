"use client";

import * as React from "react";

type InstallOutcome = "accepted" | "dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallOutcome; platform: string }>;
}

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

interface PwaInstallValue {
  canInstall: boolean;
  installed: boolean;
  isIos: boolean;
  install: () => Promise<InstallOutcome | "unavailable">;
}

const PwaInstallContext = React.createContext<PwaInstallValue | null>(null);

function readStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as NavigatorWithStandalone).standalone)
  );
}

function readIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function PwaInstallProvider({ children }: { children: React.ReactNode }) {
  const [promptEvent, setPromptEvent] =
    React.useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = React.useState(false);
  const [isIos, setIsIos] = React.useState(false);

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setInstalled(readStandalone());
      setIsIos(readIos());
    });

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setPromptEvent(null);
      setInstalled(true);
    };
    const media = window.matchMedia("(display-mode: standalone)");
    const onDisplayModeChange = () => setInstalled(readStandalone());

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener("change", onDisplayModeChange);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", onDisplayModeChange);
    };
  }, []);

  const install = React.useCallback(async () => {
    if (!promptEvent) return "unavailable" as const;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    if (choice.outcome === "accepted") setInstalled(true);
    return choice.outcome;
  }, [promptEvent]);

  const value = React.useMemo<PwaInstallValue>(
    () => ({
      canInstall: Boolean(promptEvent) && !installed,
      installed,
      isIos,
      install,
    }),
    [installed, install, isIos, promptEvent]
  );

  return (
    <PwaInstallContext.Provider value={value}>
      {children}
    </PwaInstallContext.Provider>
  );
}

export function usePwaInstallContext() {
  const context = React.useContext(PwaInstallContext);
  if (!context) {
    throw new Error("usePwaInstall must be used within PwaInstallProvider");
  }
  return context;
}
