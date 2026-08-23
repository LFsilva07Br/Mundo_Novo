/*
 * Service worker do App de Campo — Mundo Novo Café.
 * Estratégia: rede primeiro para navegação (com fallback ao cache),
 * cache primeiro para assets imutáveis do Next. Os DADOS offline vivem
 * no IndexedDB (src/lib/campo) — aqui cuidamos só da casca do app.
 */
const CACHE = "mundo-novo-v1";

self.addEventListener("install", (evento) => {
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evento) => {
  const req = evento.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Assets imutáveis: cache primeiro
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icone")) {
    evento.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const emCache = await cache.match(req);
        if (emCache) return emCache;
        const resposta = await fetch(req);
        if (resposta.ok) cache.put(req, resposta.clone());
        return resposta;
      }),
    );
    return;
  }

  // Navegação e demais GETs: rede primeiro, fallback ao cache (offline)
  evento.respondWith(
    fetch(req)
      .then((resposta) => {
        if (resposta.ok && (req.mode === "navigate" || url.pathname.startsWith("/campo"))) {
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copia));
        }
        return resposta;
      })
      .catch(async () => {
        const cache = await caches.open(CACHE);
        const emCache = await cache.match(req);
        if (emCache) return emCache;
        if (req.mode === "navigate") {
          const campo = await cache.match("/campo");
          if (campo) return campo;
        }
        return Response.error();
      }),
  );
});
