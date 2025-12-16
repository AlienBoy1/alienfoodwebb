// Service Worker personalizado con soporte para notificaciones push
console.log("🚀 Service Worker personalizado (sw-custom.js) iniciando...");

// CRÍTICO: Registrar el listener de push LO PRIMERO, antes de cualquier otra cosa
// Esto es absolutamente necesario porque si el listener no está registrado cuando llega el evento, se perderá
console.log("🔔 [CRÍTICO] Registrando listener de push INMEDIATAMENTE...");
self.addEventListener("push", async function (event) {
  console.log("🔔 ========== PUSH EVENT RECIBIDO ==========");
  console.log("Service Worker activo:", self.registration.active ? "Sí" : "No");
  console.log("Service Worker scope:", self.registration.scope);
  console.log("Timestamp:", new Date().toISOString());
  
  // Verificar que tenemos permisos para mostrar notificaciones
  try {
    const notifications = await self.registration.getNotifications();
    console.log(`Notificaciones actuales: ${notifications.length}`);
  } catch (e) {
    console.error("Error obteniendo notificaciones:", e);
  }
  
  let data = {};
  let rawData = null;
  
  if (event.data) {
    try {
      // web-push envía los datos como texto JSON (síncrono)
      // Intentar obtener los datos como texto primero (método más común)
      try {
        rawData = event.data.text();
        console.log("Datos recibidos (texto):", rawData);
        if (rawData && rawData.trim()) {
          data = JSON.parse(rawData);
          console.log("✅ Datos parseados correctamente desde texto:", data);
        } else {
          throw new Error("Datos vacíos o inválidos");
        }
      } catch (textError) {
        console.warn("No se pudo obtener como texto, intentando otros métodos:", textError);
        
        // Intentar como JSON directamente
        try {
          if (typeof event.data.json === 'function') {
            data = event.data.json();
            console.log("✅ Datos recibidos como JSON:", data);
          } else {
            throw new Error("Método json() no disponible");
          }
        } catch (jsonError) {
          console.warn("No se pudo obtener como JSON:", jsonError);
          
          // Intentar como ArrayBuffer
          try {
            if (typeof event.data.arrayBuffer === 'function') {
              const buffer = event.data.arrayBuffer();
              const text = new TextDecoder().decode(buffer);
              console.log("Datos recibidos (ArrayBuffer):", text);
              if (text && text.trim()) {
                data = JSON.parse(text);
                console.log("✅ Datos parseados desde ArrayBuffer:", data);
              } else {
                throw new Error("Buffer vacío");
              }
            } else {
              // Si los datos ya son un objeto
              data = event.data;
              console.log("✅ Datos recibidos como objeto directo:", data);
            }
          } catch (bufferError) {
            console.error("Error con ArrayBuffer:", bufferError);
            throw bufferError;
          }
        }
      }
    } catch (e) {
      console.error("❌ Error parseando datos push:", e);
      console.error("Datos raw:", rawData);
      console.error("Tipo de event.data:", typeof event.data);
      
      // Fallback: usar datos como texto plano
      try {
        const textData = rawData || (typeof event.data.text === 'function' ? event.data.text() : String(event.data || ""));
        data = { 
          title: "TUNEL DEL TIEMPO", 
          body: textData || "Tienes una nueva notificación" 
        };
        console.log("⚠️ Usando datos como texto plano:", data);
      } catch (fallbackError) {
        console.error("Error en fallback:", fallbackError);
        data = { title: "TUNEL DEL TIEMPO", body: "Tienes una nueva notificación" };
      }
    }
  } else {
    console.warn("⚠️ Push event sin datos");
    data = { title: "TUNEL DEL TIEMPO", body: "Tienes una nueva notificación" };
  }

  const title = data.title || "TUNEL DEL TIEMPO";
  const body = data.body || data.message || "Tienes una nueva notificación";
  
  // Generar un tag único para cada notificación para que no se reemplacen
  const uniqueTag = data.tag || `tunel-tiempo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`📢 Preparando notificación: "${title}" - "${body}"`);
  console.log(`Tag único: ${uniqueTag}`);
  
  const options = {
    body: body,
    icon: data.icon || "/img/favicons/android-chrome-192x192.png",
    badge: data.badge || "/img/favicons/android-chrome-192x192.png",
    data: data.data || { url: "/" },
    requireInteraction: false,
    tag: uniqueTag,
    timestamp: Date.now(),
    vibrate: [200, 100, 200],
    renotify: false,
    silent: false,
    // Agregar acciones si el navegador las soporta
    actions: [
      {
        action: "view",
        title: "Ver",
      },
      {
        action: "close",
        title: "Cerrar",
      },
    ],
  };

  console.log("Opciones de notificación:", options);

  // CRÍTICO: Usar waitUntil desde el principio para mantener el service worker activo
  // Esto debe envolver TODA la operación asíncrona
  event.waitUntil(
    (async () => {
      try {
        // Verificar permisos antes de mostrar la notificación
        // Aunque el service worker puede mostrar notificaciones sin permisos explícitos,
        // es bueno verificar que todo esté en orden
        console.log("🔔 Intentando mostrar notificación push...");
        
        // Mostrar la notificación
        await self.registration.showNotification(title, options);
        console.log("✅ Notificación mostrada exitosamente:", title);
        console.log("Tag:", uniqueTag);
        
        // Verificar que la notificación se mostró correctamente
        const notifications = await self.registration.getNotifications({ tag: uniqueTag });
        if (notifications.length > 0) {
          console.log("✅ Notificación confirmada en el sistema:", notifications[0].title);
        } else {
          console.warn("⚠️ La notificación no aparece en el sistema después de mostrarla");
        }
        
        // Notificar al cliente para que guarde la notificación
        try {
          const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
          console.log(`Encontrados ${clients.length} clientes para notificar`);
          
          // Enviar mensajes a todos los clientes
          // postMessage no devuelve una Promise, así que no podemos usar .catch()
          clients.forEach(client => {
            try {
              console.log("Enviando mensaje a cliente:", client.url);
              client.postMessage({
                type: 'SAVE_NOTIFICATION',
                notification: {
                  title: title,
                  body: body,
                  icon: data.icon || "/img/favicons/android-chrome-192x192.png",
                  data: data.data || { url: "/" },
                  tag: uniqueTag,
                }
              });
            } catch (postError) {
              console.error("Error enviando mensaje a cliente:", postError);
            }
          });
        } catch (clientError) {
          console.error("Error obteniendo clientes:", clientError);
          // No lanzar el error, la notificación ya se mostró
        }
      } catch (error) {
        console.error("❌ Error mostrando notificación:", error);
        console.error("Detalles del error:", {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        // Re-lanzar el error para que waitUntil sepa que falló
        throw error;
      }
    })()
  );
});
console.log("✅ Listener de push registrado correctamente");

// Cargar workbox de forma segura
try {
  importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js');
  console.log("✅ Workbox cargado correctamente");
} catch (error) {
  console.error('Error cargando Workbox, continuando sin él:', error);
}

// Configuración básica inmediata
self.skipWaiting();
self.clients.claim();

// Log cuando el service worker se instala
self.addEventListener('install', function(event) {
  console.log('📦 Service Worker instalado');
  // Forzar activación inmediata
  self.skipWaiting();
});

// Log cuando el service worker se activa
self.addEventListener('activate', function(event) {
  console.log('🔧 Service Worker activado');
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('✅ Service Worker tomó control de todos los clientes');
      // Notificar a los clientes que el service worker está listo
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          try {
            client.postMessage({ type: 'SW_READY' });
          } catch (e) {
            // Ignorar errores al enviar mensaje
          }
        });
      });
    })
  );
});

// CRÍTICO: Interceptar todas las peticiones para manejar offline
// Esto debe estar ANTES de la configuración de Workbox para que tenga prioridad
self.addEventListener('fetch', function(event) {
  // Solo manejar peticiones de navegación (páginas HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Si la respuesta es exitosa, cachearla y devolverla
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open('pages').then(cache => {
              cache.put(event.request, responseClone).catch(e => {
                console.warn('Error cacheando página:', e);
              });
            }).catch(e => {
              console.warn('Error abriendo cache:', e);
            });
            return response;
          }
          // Si la respuesta no es exitosa, intentar cache
          return caches.match(event.request).then(cachedResponse => {
            return cachedResponse || response;
          });
        })
        .catch(() => {
          // Si falla el fetch (offline), intentar obtener del cache
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              console.log('📴 Offline: Usando página desde cache:', event.request.url);
              return cachedResponse;
            }
            // Si no hay cache de esta página específica, intentar la página principal
            return caches.match('/').then(fallbackResponse => {
              if (fallbackResponse) {
                console.log('📴 Offline: Usando página principal desde cache');
                return fallbackResponse;
              }
              // Último recurso: respuesta offline básica
              return new Response('Offline - No hay conexión', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              });
            });
          });
        })
    );
  }
  // Para otras peticiones (API, assets, etc.), dejar que Workbox las maneje
});

// CRÍTICO: Interceptar peticiones de navegación para manejar offline
// Esto debe estar ANTES de Workbox para que tenga prioridad
self.addEventListener('fetch', function(event) {
  // Solo manejar peticiones de navegación (páginas HTML)
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      (async () => {
        try {
          // Intentar hacer fetch primero
          const response = await fetch(event.request);
          
          // Si la respuesta es exitosa, cachearla y devolverla
          if (response && response.status === 200) {
            const responseClone = response.clone();
            try {
              const cache = await caches.open('pages');
              // Normalizar la URL para el cache
              const cacheKey = new URL(event.request.url);
              const cacheRequest = new Request(cacheKey.pathname + cacheKey.search, {
                method: 'GET',
                headers: event.request.headers
              });
              await cache.put(cacheRequest, responseClone);
              console.log('✅ Página cacheada:', event.request.url);
            } catch (cacheError) {
              console.warn('Error cacheando página:', cacheError);
            }
            return response;
          }
          
          // Si la respuesta no es exitosa, intentar cache
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            console.log('✅ Usando página desde cache (respuesta no exitosa):', event.request.url);
            return cachedResponse;
          }
          return response;
        } catch (fetchError) {
          // Si falla el fetch (offline), intentar obtener del cache
          console.log('📴 Fetch falló, intentando cache:', event.request.url);
          
          // Intentar obtener la página específica del cache
          let cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            console.log('✅ Offline: Usando página desde cache:', event.request.url);
            return cachedResponse;
          }
          
          // Intentar con URL normalizada
          try {
            const url = new URL(event.request.url);
            cachedResponse = await caches.match(url.pathname + url.search);
            if (cachedResponse) {
              console.log('✅ Offline: Usando página desde cache (normalizada):', url.pathname);
              return cachedResponse;
            }
          } catch (e) {
            // Ignorar errores de URL
          }
          
          // Si no hay cache de esta página específica, intentar la página principal
          const fallbackResponse = await caches.match('/');
          if (fallbackResponse) {
            console.log('✅ Offline: Usando página principal desde cache');
            return fallbackResponse;
          }
          
          // Último recurso: intentar obtener cualquier página del cache
          const allCaches = await caches.keys();
          for (const cacheName of allCaches) {
            const cache = await caches.open(cacheName);
            cachedResponse = await cache.match(event.request);
            if (cachedResponse) {
              console.log('✅ Offline: Encontrada página en cache alternativo:', cacheName);
              return cachedResponse;
            }
          }
          
          // Si no hay ningún cache, devolver respuesta offline básica
          console.warn('⚠️ No hay cache disponible para:', event.request.url);
          return new Response('Offline - No hay conexión', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
      })()
    );
  }
  // Para otras peticiones (API, assets, etc.), dejar que Workbox las maneje
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click recibido:", event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(function (clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Workbox configuration - Solo si workbox está disponible
if (typeof workbox !== 'undefined') {
  try {
    workbox.skipWaiting();
    workbox.clientsClaim();

    // Estrategia para páginas: NetworkFirst con fallback a cache
    // CRÍTICO: En modo offline, debe usar cache para que la app funcione
    workbox.routing.registerRoute(
      ({ request }) => request.destination === 'document',
      new workbox.strategies.NetworkFirst({
        cacheName: 'pages',
        networkTimeoutSeconds: 2,
        plugins: [
          {
            cacheKeyWillBeUsed: async ({ request }) => {
              // Normalizar la URL para evitar problemas con rutas dinámicas
              const url = new URL(request.url);
              return url.pathname + url.search;
            },
            cacheWillUpdate: async ({ response }) => {
              // Solo cachear respuestas exitosas
              if (response && response.status === 200) {
                return response;
              }
              return null;
            },
            // Manejar errores de red
            fetchDidFail: async ({ request }) => {
              console.log('📴 Fetch falló, intentando usar cache para:', request.url);
            },
            // Manejar cuando no hay respuesta de red
            requestWillFetch: async ({ request }) => {
              // Si estamos offline, no intentar hacer fetch
              if (!navigator.onLine) {
                console.log('📴 Offline detectado, usando cache para:', request.url);
                return null; // Esto hará que use el cache directamente
              }
              return request;
            },
          },
        ],
      })
    );

    // Estrategia para imágenes: CacheFirst con mejor manejo offline
    workbox.routing.registerRoute(
      ({ request }) => {
        // Cachear todas las imágenes, incluyendo las de Next.js Image
        return request.destination === 'image' || 
               request.url.includes('/_next/image') ||
               request.url.includes('/img/') ||
               request.url.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i);
      },
      new workbox.strategies.CacheFirst({
        cacheName: 'images',
        plugins: [
          {
            cacheWillUpdate: async ({ response }) => {
              return response && response.status === 200 ? response : null;
            },
            expiration: {
              maxEntries: 200, // Aumentar límite de imágenes
              maxAgeSeconds: 30 * 24 * 60 * 60, // 30 días
            },
            cacheKeyWillBeUsed: async ({ request }) => {
              // Normalizar URLs de imágenes para mejor cacheo
              const url = new URL(request.url);
              return url.pathname + url.search;
            },
          },
        ],
      })
    );
    
    // Interceptar peticiones de imágenes directamente para mejor cacheo offline
    self.addEventListener('fetch', function(event) {
      const url = new URL(event.request.url);
      const isImage = event.request.destination === 'image' || 
                     url.pathname.includes('/_next/image') ||
                     url.pathname.includes('/img/') ||
                     url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i);
      
      if (isImage && event.request.method === 'GET') {
        event.respondWith(
          caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return fetch(event.request).then(response => {
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open('images').then(cache => {
                  cache.put(event.request, responseClone);
                });
              }
              return response;
            }).catch(() => {
              // Si falla y no hay cache, devolver imagen placeholder
              return new Response('', {
                status: 503,
                statusText: 'Image not available offline'
              });
            });
          })
        );
      }
    });

    // Estrategia para APIs: NetworkFirst con fallback a cache
    // CRÍTICO: En modo offline, debe devolver datos del cache o una respuesta offline
    workbox.routing.registerRoute(
      ({ url }) => url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth/'),
      new workbox.strategies.NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 3,
        plugins: [
          {
            cacheWillUpdate: async ({ response }) => {
              return response && response.status === 200 ? response : null;
            },
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 24 * 60 * 60, // 24 horas para datos offline
            },
            // Manejar errores de red
            fetchDidFail: async ({ request }) => {
              console.log('API request falló, intentando usar cache:', request.url);
            },
          },
        ],
        // Fallback a cache si no hay red
        fallbackToCache: true,
      })
    );

    // Estrategia para assets estáticos: StaleWhileRevalidate
    workbox.routing.registerRoute(
      ({ request }) => 
        request.destination === 'script' || 
        request.destination === 'style' ||
        request.destination === 'font',
      new workbox.strategies.StaleWhileRevalidate({
        cacheName: 'static-assets',
        plugins: [
          {
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 7 * 24 * 60 * 60, // 7 días
            },
          },
        ],
      })
    );
  } catch (e) {
    console.error('Error configurando workbox:', e);
  }
}

// Sincronización en background cuando vuelve la conexión
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Función para sincronizar datos cuando vuelve la conexión
async function syncData() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_STARTED',
        message: 'Sincronizando datos...'
      });
    });
    
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        message: 'Datos sincronizados correctamente'
      });
    });
  } catch (error) {
    console.error('Error en sincronización:', error);
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_ERROR',
        message: 'Error al sincronizar datos'
      });
    });
  }
}

// Manejar mensajes del cliente
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'SYNC_REQUEST') {
    self.registration.sync.register('sync-data').catch(err => {
      console.error('Error registrando sync:', err);
    });
  }

  if (event.data && event.data.type === 'SAVE_NOTIFICATION') {
    // Guardar notificación desde el cliente (tiene acceso a userId)
    saveNotificationFromClient(event.data.notification);
  }

  if (event.data && event.data.type === 'PUSH_READY_CHECK') {
    // Responder que el service worker está listo para push
    console.log('✅ Service Worker confirmado listo para push notifications');
    event.ports && event.ports[0] && event.ports[0].postMessage({ ready: true });
  }
});

// Función para guardar notificación desde el cliente (tiene userId)
async function saveNotificationFromClient(notificationData) {
  try {
    await fetch("/api/notifications/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notificationData),
    });
    console.log("Notificación guardada desde cliente");
  } catch (error) {
    console.error("Error guardando notificación desde cliente:", error);
  }
}
