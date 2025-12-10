// Interceptor para fetch que guarda peticiones cuando está offline
import offlineSync from "./OfflineSync";
import indexedDBService from "./IndexedDBService";

// Función para verificar si estamos offline
function isOffline() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }
  return !navigator.onLine;
}

// Función para obtener datos del cache si están disponibles
async function getFromCache(url) {
  try {
    await indexedDBService.init();
    
    // Intentar obtener de IndexedDB según el tipo de petición
    if (url.includes("/api/dishes")) {
      const dishes = await indexedDBService.getDishes();
      if (dishes && dishes.length > 0) {
        return { ok: true, json: async () => dishes, status: 200 };
      }
    }
    
    if (url.includes("/api/categories")) {
      const categories = await indexedDBService.getCategories();
      if (categories && categories.length > 0) {
        return { ok: true, json: async () => categories, status: 200 };
      }
      // Si no hay categorías en cache, devolver array vacío
      return { ok: true, json: async () => [], status: 200 };
    }
    
    if (url.includes("/api/orders")) {
      const orders = await indexedDBService.getOrders();
      if (orders && orders.length > 0) {
        return { ok: true, json: async () => orders, status: 200 };
      }
      // Si no hay pedidos en cache, devolver array vacío
      return { ok: true, json: async () => [], status: 200 };
    }
    
    if (url.includes("/api/notifications")) {
      // Las notificaciones se manejan en el servidor, pero devolvemos array vacío offline
      return { ok: true, json: async () => [], status: 200 };
    }
    
    if (url.includes("/api/admin/users")) {
      const users = await indexedDBService.getUsers();
      if (users && users.length > 0) {
        return { ok: true, json: async () => users, status: 200 };
      }
      // Si no hay usuarios en cache, devolver array vacío
      return { ok: true, json: async () => [], status: 200 };
    }
    
    return null;
  } catch (error) {
    console.error("Error obteniendo del cache:", error);
    return null;
  }
}

// Wrapper para fetch que maneja offline
export async function offlineFetch(url, options = {}) {
  const method = options.method || "GET";
  const isGetRequest = method === "GET";
  
  // Si es GET y estamos offline, intentar obtener del cache
  if (isGetRequest && isOffline()) {
    console.log("📴 Offline: Intentando obtener del cache:", url);
    const cachedResponse = await getFromCache(url);
    
    if (cachedResponse) {
      console.log("✅ Datos obtenidos del cache:", url);
      return cachedResponse;
    }
    
    // Si no hay cache, devolver array vacío para APIs que devuelven arrays
    // NO guardar GET en la cola, solo devolver datos vacíos
    console.warn("⚠️ No hay datos en cache para:", url);
    return {
      ok: true,
      status: 200,
      statusText: "OK (Offline - Empty)",
      json: async () => {
        // Devolver array vacío para APIs que devuelven arrays
        if (url.includes("/api/") && (
          url.includes("/notifications") ||
          url.includes("/orders") ||
          url.includes("/dishes") ||
          url.includes("/categories") ||
          url.includes("/users") ||
          url.includes("/active-orders")
        )) {
          return [];
        }
        return { error: "Sin conexión y sin datos en cache" };
      },
    };
  }
  
  // Si es POST/PUT/DELETE y estamos offline, guardar en la cola
  if (!isGetRequest && isOffline()) {
    console.log("📴 Offline: Guardando petición en cola:", url, method);
    
    const queueResult = await offlineSync.addToSyncQueue(
      url,
      method,
      options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {},
      options.headers || {}
    );
    
    // Devolver una respuesta simulada indicando que se guardó
    return {
      ok: true,
      status: 202,
      statusText: "Accepted (Queued for sync)",
      json: async () => ({
        message: "Petición guardada para sincronización cuando vuelva la conexión",
        queued: true,
      }),
    };
  }
  
  // Si hay conexión, hacer la petición normal
  try {
    const response = await fetch(url, options);
    
    // Si la petición fue exitosa y es GET, guardar en cache
    if (isGetRequest && response.ok) {
      try {
        const data = await response.clone().json();
        
        // Guardar en IndexedDB según el tipo
        if (url.includes("/api/dishes")) {
          await indexedDBService.init();
          await indexedDBService.saveDishes(data);
        }
        
        if (url.includes("/api/orders")) {
          await indexedDBService.init();
          await indexedDBService.saveOrders(data);
        }
      } catch (e) {
        // Ignorar errores al guardar en cache
        console.debug("No se pudo guardar en cache:", e);
      }
    }
    
    return response;
  } catch (error) {
    // Si falla la petición y estamos offline, intentar cache
    if (isOffline() && isGetRequest) {
      const cachedResponse = await getFromCache(url);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Si no hay cache, lanzar el error
    throw error;
  }
}

// fetch es una API global del navegador, no necesita exportarse
// Si necesitas usar fetch normal, simplemente usa fetch() directamente

