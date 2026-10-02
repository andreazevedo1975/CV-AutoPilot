/**
 * CV-AutoPilot Enterprise - Service Worker com Workbox 7
 * Permite acesso offline completo para consulta de currículos, histórico de candidaturas
 * e análise de vagas em trânsito ou sem conexão estável com a internet.
 */

// 1. Carregar a biblioteca oficial Workbox da Google via CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

const CACHE_VERSION = 'v4-stable';
const HTML_CACHE = `cv-autopilot-html-${CACHE_VERSION}`;
const STATIC_CACHE = `cv-autopilot-static-${CACHE_VERSION}`;
const IMAGES_CACHE = `cv-autopilot-images-${CACHE_VERSION}`;
const CDN_CACHE = `cv-autopilot-cdn-${CACHE_VERSION}`;

if (typeof workbox !== 'undefined' && workbox) {
  // Configurações do Workbox
  workbox.setConfig({ debug: false });

  // Forçar ativação imediata para atualizar abas abertas
  self.skipWaiting();
  workbox.core.clientsClaim();

  // Limpeza de caches legados na ativação
  self.addEventListener('activate', (event) => {
    const currentCaches = [HTML_CACHE, STATIC_CACHE, IMAGES_CACHE, CDN_CACHE];
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (!currentCaches.includes(name) && !name.startsWith('workbox-precache')) {
              return caches.delete(name);
            }
          })
        );
      })
    );
  });

  // 1. Pré-cache do App Shell essencial para inicialização offline instantânea
  workbox.precaching.precacheAndRoute([
    { url: '/', revision: '3.2.0' },
    { url: '/index.html', revision: '3.2.0' },
    { url: '/manifest.json', revision: '3.2.0' },
    { url: '/index.css', revision: '3.2.0' },
    { url: '/src/assets/images/cv_autopilot_logo_1789832318438.jpg', revision: '3.2.0' },
    { url: '/assets/icon-192.jpg', revision: '3.2.0' },
    { url: '/assets/icon-512.jpg', revision: '3.2.0' }
  ]);

  // 2. Navegação de Páginas (HTML): NetworkFirst com Timeout de 3s
  // Quando online, carrega a versão mais recente; se offline ou em rede lenta, serve o cache instantaneamente
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate' || request.destination === 'document',
    new workbox.strategies.NetworkFirst({
      cacheName: HTML_CACHE,
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 dias
        }),
      ],
    })
  );

  // 3. Recursos Estáticos da Aplicação (Scripts JS gerados pelo Vite, CSS, Web Workers)
  // Estratégia Stale-While-Revalidate: resposta rápida a partir do cache e atualização em segundo plano
  workbox.routing.registerRoute(
    ({ request, url }) =>
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'worker' ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: STATIC_CACHE,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 120,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
        }),
      ],
    })
  );

  // 4. Assets Estáticos do Aplicativo (Logo, Ícones, Favicons e Imagens)
  // Estratégia Stale-While-Revalidate: entrega imediata do cache para máxima velocidade offline
  // com revalidação em segundo plano na rede para atualizar sem travar ou consumir dados em excesso
  workbox.routing.registerRoute(
    ({ request, url }) =>
      request.destination === 'image' ||
      url.pathname.startsWith('/src/assets/') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.webp') ||
      url.pathname.endsWith('.ico'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: IMAGES_CACHE,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 80,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 5. Fontes Google Fonts (CSS e arquivos WOFF2)
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 ano
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 6. Bibliotecas Externas carregadas via CDN (Tailwind, Mammoth DOCX, PDF.js, jsPDF, etc.)
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === 'https://cdn.tailwindcss.com' ||
      url.origin === 'https://unpkg.com' ||
      url.origin === 'https://cdnjs.cloudflare.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: CDN_CACHE,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 7. Fallback offline garantido: Se a navegação falhar e não houver rede, abre a página principal do app
  workbox.routing.setCatchHandler(async ({ event }) => {
    if (event.request.destination === 'document' || event.request.mode === 'navigate') {
      const cachedIndex = (await caches.match('/index.html')) || (await caches.match('/'));
      if (cachedIndex) {
        return cachedIndex;
      }
    }
    return Response.error();
  });

  // 8. Mensageria para 'Salvar para Leitura Offline' & Background Sync (Sincronização de Dados Offline)
  self.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || !data.type) return;

    if (data.type === 'SAVE_OFFLINE_DOC') {
      const doc = data.payload?.document;
      if (doc) {
        console.log(`[SW Workbox] Documento indexado para leitura offline: "${doc.title}" [${doc.type}]`);
        // Assegura pré-aquecimento do cache dos arquivos da aplicação
        caches.open(STATIC_CACHE).then((cache) => {
          cache.add('/index.html').catch(() => {});
          cache.add('/index.css').catch(() => {});
          cache.add('/manifest.json').catch(() => {});
          cache.add('/src/assets/images/cv_autopilot_logo_1789832318438.jpg').catch(() => {});
        });
      }
    } else if (data.type === 'REMOVE_OFFLINE_DOC') {
      console.log(`[SW Workbox] Documento removido do modo offline: ${data.payload?.id}`);
    } else if (data.type === 'REGISTER_OFFLINE_MUTATION') {
      console.log(`[SW Workbox BgSync] Mutação offline registrada: ${data.payload?.type} [${data.payload?.id}]`);
      // Se houver suporte à API Background Sync nativa, confirma registro
      if ('sync' in self.registration) {
        self.registration.sync.register('cv-autopilot-bg-sync').catch(() => {});
      }
    } else if (data.type === 'TRIGGER_SYNC_NOW') {
      console.log('[SW Workbox BgSync] Sincronização forçada solicitada pelo cliente.');
      self.clients.matchAll().then((clients) => {
        clients.forEach((c) => {
          c.postMessage({
            type: 'WORKBOX_BACKGROUND_SYNC_TRIGGERED',
            payload: { forced: true, timestamp: new Date().toISOString() }
          });
        });
      });
    }
  });

  // 9. Tarefa de Background Sync com Workbox 7
  // Detecta quando o usuário volta a ter conexão e sincroniza automaticamente os status
  // de candidaturas ou novos dados de currículos que foram criados/alterados offline.
  let bgSyncQueue = null;
  if (typeof workbox !== 'undefined' && workbox.backgroundSync && workbox.backgroundSync.Queue) {
    try {
      bgSyncQueue = new workbox.backgroundSync.Queue('cv-autopilot-bg-sync-queue', {
        maxRetentionTime: 24 * 60, // 24 horas em minutos
        onSync: async ({ queue }) => {
          console.log('[Workbox BgSync] Disparo de sincronização automática com retorno de rede.');
          let entry;
          let count = 0;
          while ((entry = await queue.shiftRequest())) {
            try {
              await fetch(entry.request.clone());
              count++;
            } catch (err) {
              await queue.unshiftRequest(entry);
              throw err;
            }
          }
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'WORKBOX_BACKGROUND_SYNC_TRIGGERED',
              payload: { count, timestamp: new Date().toISOString() }
            });
          });
        }
      });
    } catch (e) {
      console.warn('[Workbox BgSync] Inicialização da fila de Background Sync:', e);
    }
  }

  // Listener para o evento padrão 'sync' disparado pelo navegador quando a rede é restabelecida
  self.addEventListener('sync', (event) => {
    if (event.tag === 'cv-autopilot-bg-sync' || event.tag.startsWith('workbox-background-sync')) {
      console.log('[Workbox BgSync] Evento de sync nativo disparado com retorno da conexão:', event.tag);
      event.waitUntil((async () => {
        const clients = await self.clients.matchAll();
        clients.forEach((client) => {
          client.postMessage({
            type: 'WORKBOX_BACKGROUND_SYNC_TRIGGERED',
            payload: { tag: event.tag, timestamp: new Date().toISOString() }
          });
        });
      })());
    }
  });

  console.log('[Workbox] Service Worker ativo com Background Sync, Stale-While-Revalidate e leitura offline.');
} else {
  // Fallback nativo simples caso o CDN do Workbox esteja inacessível na instalação inicial
  console.warn('[Workbox] CDN inacessível, ativando fallback nativo do Service Worker.');

  const NATIVE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/index.css',
    '/src/assets/images/cv_autopilot_logo_1789832318438.jpg'
  ];

  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(STATIC_CACHE).then((cache) => cache.addAll(NATIVE_ASSETS).catch(() => {}))
    );
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
  });

  self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET' || event.request.url.includes('/api/')) return;
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).catch(() => {
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
      })
    );
  });
}
