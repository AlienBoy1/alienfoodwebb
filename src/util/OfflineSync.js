// Servicio para sincronizar datos cuando vuelve la conexión
import indexedDBService from "./IndexedDBService";

class OfflineSync {
  constructor() {
    if (typeof window !== "undefined" && typeof navigator !== "undefined") {
      this.isOnline = navigator.onLine;
      this.setupListeners();
    } else {
      // En el servidor, asumir que está online
      this.isOnline = true;
    }
  }

  setupListeners() {
    // Solo en el cliente
    if (typeof window === "undefined") return;
    
    // Escuchar cambios en el estado de conexión
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.handleOnline();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.handleOffline();
    });
  }

  async handleOnline() {
    console.log("✅ Conexión restaurada, sincronizando datos...");
    
    try {
      // Verificar que IndexedDB esté inicializado
      await indexedDBService.init();
      
      // Sincronizar cola de acciones pendientes primero
      const queueItems = await indexedDBService.getSyncQueue();
      if (queueItems && queueItems.length > 0) {
        console.log(`📤 Sincronizando ${queueItems.length} peticiones pendientes...`);
        // syncQueue ahora maneja los mensajes específicos internamente
        await this.syncQueue();
      } else {
        // Si no hay peticiones pendientes, solo sincronizar datos
        await this.syncData();
        
        if (window.dispatchEvent) {
          window.dispatchEvent(
            new CustomEvent("syncComplete", {
              detail: { message: "Datos sincronizados correctamente" },
            })
          );
        }
      }
    } catch (error) {
      console.error("❌ Error en sincronización:", error);
      if (window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent("syncError", {
            detail: { message: "Error al sincronizar datos. Se reintentará automáticamente." },
          })
        );
      }
    }
  }

  handleOffline() {
    if (typeof window === "undefined") return;
    
    console.log("Sin conexión, guardando datos localmente...");
    
    if (window.dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent("offline", {
          detail: { message: "Modo offline activado" },
        })
      );
    }
  }

  // Sincronizar cola de acciones pendientes
  async syncQueue() {
    try {
      await indexedDBService.init();
      const queue = await indexedDBService.getSyncQueue();

      const results = {
        cart: { success: 0, failed: 0, items: [] },
        notifications: { success: 0, failed: 0 },
        orders: { success: 0, failed: 0 },
        other: { success: 0, failed: 0 }
      };

      for (const item of queue) {
        try {
          // Saltar peticiones GET - no deberían estar en la cola
          const requestMethod = (item.method || "POST").toUpperCase();
          if (requestMethod === "GET" || requestMethod === "HEAD") {
            console.warn("⚠️ Petición GET encontrada en cola, eliminándola:", item.url);
            await indexedDBService.removeFromSyncQueue(item.id);
            continue;
          }
          
          // Identificar el tipo de petición
          const requestType = this.identifyRequestType(item.url, item.data);
          
          // Intentar ejecutar la acción
          const success = await this.executeSyncItem(item);

          if (success) {
            // Registrar éxito según el tipo
            if (requestType === 'cart') {
              results.cart.success++;
              if (item.data && item.data.title) {
                results.cart.items.push(item.data.title);
              }
            } else if (requestType === 'notification') {
              results.notifications.success++;
            } else if (requestType === 'order') {
              results.orders.success++;
            } else {
              results.other.success++;
            }
            
            // Eliminar de la cola si fue exitoso
            await indexedDBService.removeFromSyncQueue(item.id);
          } else {
            // Registrar fallo según el tipo
            if (requestType === 'cart') {
              results.cart.failed++;
            } else if (requestType === 'notification') {
              results.notifications.failed++;
            } else if (requestType === 'order') {
              results.orders.failed++;
            } else {
              results.other.failed++;
            }
            
            // Incrementar contador de reintentos
            item.retries = (item.retries || 0) + 1;
            
            // Si excede el máximo de reintentos, eliminar
            if (item.retries > 5) {
              await indexedDBService.removeFromSyncQueue(item.id);
            }
          }
        } catch (error) {
          console.error("Error ejecutando item de sincronización:", error);
          results.other.failed++;
        }
      }

      // Generar mensajes específicos
      const messages = [];
      
      if (results.cart.success > 0) {
        if (results.cart.items.length > 0) {
          const itemsText = results.cart.items.length === 1 
            ? results.cart.items[0]
            : `${results.cart.items.length} elementos`;
          messages.push(`✅ Se añadió ${itemsText} al carrito`);
        } else {
          messages.push(`✅ ${results.cart.success} elemento(s) añadido(s) al carrito`);
        }
      }
      
      if (results.notifications.success > 0) {
        messages.push(`✅ ${results.notifications.success} notificación(es) enviada(s) correctamente`);
      }
      
      if (results.notifications.failed > 0) {
        messages.push(`❌ ${results.notifications.failed} notificación(es) no pudieron ser enviadas`);
      }
      
      if (results.orders.success > 0) {
        messages.push(`✅ ${results.orders.success} pedido(s) procesado(s) correctamente`);
      }
      
      if (results.other.success > 0) {
        messages.push(`✅ ${results.other.success} petición(es) completada(s)`);
      }

      // Enviar mensajes al cliente
      if (messages.length > 0 && window.dispatchEvent) {
        messages.forEach((message, index) => {
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("syncComplete", {
                detail: { message }
              })
            );
          }, index * 500); // Espaciar mensajes
        });
      }

      return results;
    } catch (error) {
      console.error("Error sincronizando cola:", error);
      return null;
    }
  }

  // Identificar el tipo de petición
  identifyRequestType(url, data) {
    if (!url) return 'other';
    
    // Notificaciones
    if (url.includes('/api/admin/send-notification')) {
      return 'notification';
    }
    
    // Carrito (añadir elementos)
    if (url.includes('/api/cart') || (data && (data._id || data.title))) {
      return 'cart';
    }
    
    // Pedidos
    if (url.includes('/api/orders') || url.includes('/api/create-checkout-session')) {
      return 'order';
    }
    
    return 'other';
  }

  // Ejecutar un item de sincronización
  async executeSyncItem(item) {
    try {
      const { type, url, method, data, headers = {} } = item;
      const requestMethod = (method || "POST").toUpperCase();

      // Configurar la petición según el método
      const fetchOptions = {
        method: requestMethod,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };

      // Solo incluir body para métodos que lo permiten (POST, PUT, PATCH, DELETE)
      // GET y HEAD no pueden tener body
      if (requestMethod !== "GET" && requestMethod !== "HEAD" && data) {
        fetchOptions.body = JSON.stringify(data);
      }

      const response = await fetch(url, fetchOptions);

      if (response.ok) {
        console.log("✅ Item sincronizado exitosamente:", url, requestMethod);
        return true;
      } else {
        console.warn("⚠️ Item sincronizado pero con error:", response.status, url);
        return false;
      }
    } catch (error) {
      console.error("❌ Error ejecutando sync item:", error);
      return false;
    }
  }

  // Sincronizar datos generales
  async syncData() {
    try {
      // Sincronizar platillos
      await this.syncDishes();
      
      // Sincronizar categorías
      await this.syncCategories();
      
      // Sincronizar pedidos
      await this.syncOrders();
    } catch (error) {
      console.error("Error sincronizando datos:", error);
    }
  }

  // Sincronizar platillos
  async syncDishes() {
    try {
      const response = await fetch("/api/dishes");
      if (response.ok) {
        const dishes = await response.json();
        await indexedDBService.saveDishes(dishes);
      }
    } catch (error) {
      console.error("Error sincronizando platillos:", error);
    }
  }

  // Sincronizar categorías
  async syncCategories() {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const categories = await response.json();
        await indexedDBService.saveCategories(categories);
      }
    } catch (error) {
      console.error("Error sincronizando categorías:", error);
    }
  }

  // Sincronizar pedidos
  async syncOrders() {
    try {
      const response = await fetch("/api/orders");
      if (response.ok) {
        const orders = await response.json();
        await indexedDBService.saveOrders(orders);
      }
    } catch (error) {
      console.error("Error sincronizando pedidos:", error);
    }
  }

  // Agregar acción a la cola de sincronización
  async addToSyncQueue(url, method, data, headers = {}) {
    const requestMethod = (method || "POST").toUpperCase();
    
    // NO guardar peticiones GET/HEAD en la cola - solo POST/PUT/DELETE/PATCH
    if (requestMethod === "GET" || requestMethod === "HEAD") {
      console.warn("⚠️ No se guardan peticiones GET/HEAD en la cola de sincronización");
      return { success: false, queued: false, reason: "GET requests should use cache, not queue" };
    }
    
    if (this.isOnline) {
      // Si hay conexión, intentar ejecutar inmediatamente
      try {
        const fetchOptions = {
          method: requestMethod,
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
        };
        
        // Solo incluir body para métodos que lo permiten
        if (requestMethod !== "GET" && requestMethod !== "HEAD" && data) {
          fetchOptions.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, fetchOptions);

        if (response.ok) {
          return { success: true, response };
        } else {
          // Si falla pero hay conexión, guardar para reintentar
          console.warn("Request falló pero hay conexión, guardando para reintentar:", response.status);
        }
      } catch (error) {
        console.error("Error ejecutando acción online:", error);
        // Si hay error de red, asumir que estamos offline
        this.isOnline = false;
      }
    }

    // Si no hay conexión o falló, agregar a la cola
    const queueItem = {
      type: "api_call",
      url,
      method: requestMethod,
      data,
      headers,
      timestamp: new Date().toISOString(),
    };
    
    await indexedDBService.addToSyncQueue(queueItem);
    console.log("✅ Acción agregada a la cola de sincronización:", {
      type: "api_call",
      url,
      method: requestMethod,
      hasData: !!data,
      headers: Object.keys(headers),
    });

    return { success: false, queued: true };
  }

  // Verificar estado de conexión
  checkConnection() {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return true; // Asumir online en servidor
    }
    return navigator.onLine;
  }
}

// Exportar instancia singleton (solo se crea cuando se importa en el cliente)
let offlineSync = null;
if (typeof window !== "undefined") {
  offlineSync = new OfflineSync();
} else {
  // Crear un objeto mock para SSR
  offlineSync = {
    isOnline: true,
    setupListeners: () => {},
    handleOnline: async () => {},
    handleOffline: () => {},
    syncQueue: async () => {},
    syncData: async () => {},
    addToSyncQueue: async () => false,
    checkConnection: () => true,
  };
}

export default offlineSync;

