/* global self, caches, fetch, Response, URL */
const CACHE_VERSION = "besanj-shell-v5";
const CORE_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/brand/besanj.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icon.svg",
  "/apple-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      Promise.all(
        CORE_ASSETS.map((asset) => cache.add(asset).catch(() => undefined))
      )
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => (key.startsWith("estelamkoo-") || key.startsWith("besanj-")) && key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;
  if (url.searchParams.has("_rsc")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match("/")) ||
            Response.error()
          );
        })
    );
    return;
  }

  const cacheableAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/brand/") ||
    url.pathname === "/icon.svg" ||
    url.pathname === "/apple-icon.png" ||
    url.pathname === "/manifest.webmanifest";

  if (!cacheableAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || Response.error());

      return cached || network;
    })
  );
});
