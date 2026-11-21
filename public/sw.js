/* Service worker SawahKu — app shell + aset statis.
 * Strategi:
 *  - Navigasi (HTML): network-first, fallback ke app shell yang tersimpan,
 *    lalu /offline.html bila benar-benar offline.
 *  - Aset statis (JS/CSS/ikon/font): stale-while-revalidate.
 *  - API PocketBase (/api/*): tidak pernah di-cache.
 */

const VERSION = "v1";
const PAGE_CACHE = `sawahku-pages-${VERSION}`;
const ASSET_CACHE = `sawahku-assets-${VERSION}`;

const PRECACHE = [
  "/",
  "/offline.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(PAGE_CACHE).then((cache) =>
      Promise.all(
        PRECACHE.map((url) =>
          cache.add(url).catch(() => {
            /* lewati aset yang gagal diambil saat instalasi */
          }),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== PAGE_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isStaticAsset(request, url) {
  if (url.pathname.startsWith("/assets/")) return true;
  return ["script", "style", "image", "font"].includes(request.destination);
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put("/", response.clone());
    return response;
  } catch {
    const cached = (await cache.match(request)) || (await cache.match("/"));
    if (cached) return cached;
    return (await cache.match("/offline.html")) || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || (await network) || Response.error();
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

  if (isStaticAsset(request, url)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
