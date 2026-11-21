/* Service worker SawahKu — app shell + aset statis.
 * Strategi:
 *  - Navigasi (HTML): network-first, fallback ke app shell yang tersimpan,
 *    lalu /offline.html bila benar-benar offline.
 *  - Aset statis (JS/CSS/ikon/font): stale-while-revalidate.
 *  - API PocketBase (/api/*): tidak pernah di-cache.
 *
 * Versi cache diambil dari ?v=<hash bundle> saat registrasi, jadi tiap deploy
 * memakai cache baru dan cache lama dibersihkan otomatis pada activate.
 */

const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const PAGE_CACHE = `sawahku-pages-${VERSION}`;
const ASSET_CACHE = `sawahku-assets-${VERSION}`;

const PRECACHE = ["/", "/offline.html", "/favicon.svg", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGE_CACHE)
      // Aset yang gagal diambil saat instalasi dilewati, instalasi tetap jalan.
      .then((cache) =>
        Promise.allSettled(PRECACHE.map((url) => cache.add(url))),
      )
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
            .filter(
              (key) =>
                key.startsWith("sawahku-") &&
                key !== PAGE_CACHE &&
                key !== ASSET_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirstNavigation(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put("/", response.clone());
    return response;
  } catch {
    // Semua rute SPA berbagi app shell yang sama, jadi cukup satu entri "/".
    return (
      (await cache.match("/")) ||
      (await cache.match("/offline.html")) ||
      Response.error()
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);

  const network = fetch(request).then(
    (response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    },
    () => Response.error(),
  );

  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (
    url.pathname.startsWith("/assets/") ||
    ["script", "style", "image", "font"].includes(request.destination)
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
