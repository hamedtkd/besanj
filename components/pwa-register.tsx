"use client";

import * as React from "react";

export function PwaRegister() {
  React.useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          if (registration.active?.scriptURL.endsWith("/sw.js")) {
            void registration.unregister();
          }
        }
      });
      return;
    }

    const register = () => {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => registration.update())
        .catch(() => {
          // The app remains fully usable if service-worker registration is blocked.
        });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
