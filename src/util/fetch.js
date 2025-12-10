import axios from "axios";
import { offlineFetch } from "./offlineFetch";

// Interceptor de axios para manejar offline
axios.interceptors.request.use(
  async (config) => {
    // Si estamos offline y no es GET, la petición se guardará en la cola
    if (typeof window !== "undefined" && !navigator.onLine && config.method !== "get") {
      console.log("📴 Offline: Interceptando petición para guardar en cola:", config.url, config.method);
      
      // Para POST/PUT/DELETE offline, guardar en la cola antes de que falle
      try {
        const offlineSync = (await import("./OfflineSync")).default;
        const result = await offlineSync.addToSyncQueue(
          config.url,
          config.method?.toUpperCase() || "POST",
          config.data ? (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) : {},
          config.headers || {}
        );
        
        if (result.queued) {
          // Retornar una respuesta simulada para que no falle
          throw new axios.Cancel('Petición guardada para sincronización offline.');
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          // Si fue cancelada porque se guardó en la cola, devolver respuesta simulada
          throw error;
        }
        console.error("Error guardando en cola:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta para manejar errores de red
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Suprimir errores de red cuando estamos offline (son esperados)
    const isOfflineError = (
      error.message === "Network Error" || 
      error.code === "ERR_INTERNET_DISCONNECTED" || 
      error.message?.includes("ERR_INTERNET_DISCONNECTED") ||
      error.message?.includes("net::ERR_INTERNET_DISCONNECTED")
    ) && typeof window !== "undefined" && !navigator.onLine;
    
    // Si es un error de red y estamos offline, intentar obtener del cache
    if (isOfflineError) {
      // Solo intentar cache para peticiones GET
      if (error.config?.method === "get" || !error.config?.method) {
        try {
          const cachedResponse = await offlineFetch(error.config.url, {
            method: "GET",
          });
          
          if (cachedResponse && cachedResponse.ok) {
            const data = await cachedResponse.json();
            return { data, status: 200, statusText: "OK (Cached)" };
          }
        } catch (cacheError) {
          // Silenciar errores de cache cuando estamos offline
        }
      }
      
      // Para POST/PUT/DELETE offline, intentar guardar en la cola si no se hizo en el request interceptor
      const requestMethod = (error.config?.method || "GET").toLowerCase();
      if (requestMethod !== "get" && requestMethod !== "head") {
        try {
          const offlineSync = (await import("./OfflineSync")).default;
          const result = await offlineSync.addToSyncQueue(
            error.config.url,
            requestMethod.toUpperCase(),
            error.config.data ? (typeof error.config.data === 'string' ? JSON.parse(error.config.data) : error.config.data) : {},
            error.config.headers || {}
          );
          
          if (result.queued) {
            // Devolver respuesta simulada
            return {
              data: {
                message: "Petición guardada para sincronización cuando vuelva la conexión",
                queued: true,
              },
              status: 202,
              statusText: "Accepted (Queued for sync)",
            };
          }
        } catch (queueError) {
          // Silenciar errores de cola cuando estamos offline
        }
      }
      
      // Suprimir el error de red (no rechazar la promesa para evitar logs en consola)
      // Devolver una respuesta vacía para que SWR no intente reintentar
      return {
        data: [],
        status: 503,
        statusText: "Service Unavailable (Offline)",
      };
    }
    
    // Si fue cancelada porque se guardó en la cola, devolver respuesta simulada
    if (axios.isCancel && axios.isCancel(error) && error.message?.includes('sincronización offline')) {
      return {
        data: {
          message: "Petición guardada para sincronización cuando vuelva la conexión",
          queued: true,
        },
        status: 202,
        statusText: "Accepted (Queued for sync)",
      };
    }
    
    return Promise.reject(error);
  }
);

const fetcher = async (...args) => {
  if (!args.length) return null;
  
  try {
    const res = await axios.get(...args);
    // Si la respuesta es exitosa, guardar en IndexedDB para uso offline
    if (res.data && typeof window !== "undefined") {
      const url = args[0];
      try {
        const indexedDBService = (await import("./IndexedDBService")).default;
        await indexedDBService.init();
        
        if (url.includes("/api/dishes") && Array.isArray(res.data)) {
          await indexedDBService.saveDishes(res.data);
        } else if (url.includes("/api/categories") && Array.isArray(res.data)) {
          await indexedDBService.saveCategories(res.data);
        } else if (url.includes("/api/orders") && Array.isArray(res.data)) {
          await indexedDBService.saveOrders(res.data);
        } else if (url.includes("/api/admin/users") && Array.isArray(res.data)) {
          await indexedDBService.saveUsers(res.data);
        } else if (url.includes("/api/admin/active-orders") && Array.isArray(res.data)) {
          await indexedDBService.saveOrders(res.data);
        } else if (url.includes("/api/notifications") && Array.isArray(res.data)) {
          // Las notificaciones se guardan en el servidor, pero podemos cachearlas localmente
          // Nota: Las notificaciones son específicas del usuario, así que el cache debe ser por usuario
        }
      } catch (cacheError) {
        // No fallar si hay error al guardar en cache
        console.warn("Error guardando en cache:", cacheError);
      }
    }
    return res.data;
  } catch (error) {
    // Si hay error y estamos offline, intentar obtener de IndexedDB
    if ((error.message === "Network Error" || error.code === "ERR_INTERNET_DISCONNECTED" || error.message?.includes("ERR_INTERNET_DISCONNECTED")) && typeof window !== "undefined" && !navigator.onLine) {
      const url = args[0];
      try {
        const indexedDBService = (await import("./IndexedDBService")).default;
        await indexedDBService.init();
        
        if (url.includes("/api/dishes")) {
          const dishes = await indexedDBService.getDishes();
          if (dishes && dishes.length > 0) {
            console.log("📴 Offline: Devolviendo dishes desde IndexedDB");
            return dishes;
          }
          return [];
        } else if (url.includes("/api/categories")) {
          const categories = await indexedDBService.getCategories();
          console.log("📴 Offline: Devolviendo categories desde IndexedDB");
          return categories || [];
        } else if (url.includes("/api/orders")) {
          const orders = await indexedDBService.getOrders();
          if (orders && orders.length > 0) {
            console.log("📴 Offline: Devolviendo orders desde IndexedDB");
            return orders;
          }
          return [];
        } else if (url.includes("/api/admin/active-orders")) {
          // Pedidos activos del admin - devolver array vacío offline
          console.log("📴 Offline: Devolviendo array vacío para pedidos activos");
          return [];
        } else if (url.includes("/api/admin/users")) {
          // Usuarios del admin - intentar obtener del cache
          const users = await indexedDBService.getUsers();
          if (users && users.length > 0) {
            console.log("📴 Offline: Devolviendo usuarios desde IndexedDB");
            return users;
          }
          console.log("📴 Offline: Devolviendo array vacío para usuarios");
          return [];
        } else if (url.includes("/api/notifications")) {
          // Las notificaciones requieren autenticación, devolver array vacío offline
          console.log("📴 Offline: Devolviendo array vacío para notificaciones");
          return [];
        }
      } catch (cacheError) {
        console.error("Error obteniendo de cache:", cacheError);
      }
    }
    throw error;
  }
};

export default fetcher;
