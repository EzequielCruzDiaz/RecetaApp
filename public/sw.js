const VERSION = "v1";
const APP_CACHE = `recetapp-app-${VERSION}`;
const ASSET_CACHE = `recetapp-assets-${VERSION}`;

const PRECACHE = [
  "/",
  "/recetas",
  "/inventario",
  "/facturas",
  "/manifest.webmanifest",
  "/tesseract/worker.min.js",
  "/tesseract/tesseract-core-simd-lstm.wasm.js",
  "/tesseract/tesseract-core-simd-lstm.wasm",
  "/tesseract/lang/spa.traineddata.gz",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== APP_CACHE && k !== ASSET_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegación: red primero, cache como respaldo offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(APP_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Estáticos de Next y assets de Tesseract: cache primero, revalida en segundo plano.
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/tesseract/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(ASSET_CACHE).then((c) => c.put(request, copy));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
