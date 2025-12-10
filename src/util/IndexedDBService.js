// Servicio para manejar IndexedDB para almacenamiento offline

const DB_NAME = "AlienFoodDB";
const DB_VERSION = 3;

// Stores (tablas) en IndexedDB
const STORES = {
  DISHES: "dishes",
  ORDERS: "orders",
  CART: "cart",
  SYNC_QUEUE: "syncQueue",
  USERS: "users",
  CATEGORIES: "categories",
  DISH_IMAGES: "dishImages", // Nuevo store para imágenes de platillos
  SETTINGS: "settings", // Store para configuraciones de la app
};

class IndexedDBService {
  constructor() {
    this.db = null;
  }

  // Inicializar la base de datos
  async init() {
    // Verificar que estamos en el cliente
    if (typeof window === "undefined" || typeof indexedDB === "undefined") {
      throw new Error("IndexedDB solo está disponible en el cliente");
    }

    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Error abriendo IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Crear stores si no existen
        if (!db.objectStoreNames.contains(STORES.DISHES)) {
          const dishesStore = db.createObjectStore(STORES.DISHES, {
            keyPath: "_id",
          });
          dishesStore.createIndex("category", "category", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.ORDERS)) {
          const ordersStore = db.createObjectStore(STORES.ORDERS, {
            keyPath: "_id",
          });
          ordersStore.createIndex("timestamp", "timestamp", { unique: false });
          ordersStore.createIndex("status", "order_status.current.status", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains(STORES.CART)) {
          db.createObjectStore(STORES.CART, { keyPath: "_id" });
        }

        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
            keyPath: "id",
            autoIncrement: true,
          });
          syncStore.createIndex("type", "type", { unique: false });
          syncStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.USERS)) {
          db.createObjectStore(STORES.USERS, { keyPath: "_id" });
        }

        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          db.createObjectStore(STORES.CATEGORIES, { keyPath: "_id" });
        }

        if (!db.objectStoreNames.contains(STORES.DISH_IMAGES)) {
          const imagesStore = db.createObjectStore(STORES.DISH_IMAGES, {
            keyPath: "id",
            autoIncrement: true,
          });
          imagesStore.createIndex("category", "category", { unique: false });
          imagesStore.createIndex("url", "url", { unique: true });
        }

        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: "key" });
        }
      };
    });
  }

  // Guardar platillos
  async saveDishes(dishes) {
    await this.init();
    const transaction = this.db.transaction([STORES.DISHES], "readwrite");
    const store = transaction.objectStore(STORES.DISHES);

    const promises = dishes.map((dish) => store.put(dish));
    await Promise.all(promises);

    return dishes;
  }

  // Obtener platillos
  async getDishes() {
    await this.init();
    const transaction = this.db.transaction([STORES.DISHES], "readonly");
    const store = transaction.objectStore(STORES.DISHES);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Guardar pedidos
  async saveOrders(orders) {
    await this.init();
    const transaction = this.db.transaction([STORES.ORDERS], "readwrite");
    const store = transaction.objectStore(STORES.ORDERS);

    const promises = orders.map((order) => store.put(order));
    await Promise.all(promises);

    return orders;
  }

  // Obtener pedidos
  async getOrders() {
    await this.init();
    const transaction = this.db.transaction([STORES.ORDERS], "readonly");
    const store = transaction.objectStore(STORES.ORDERS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Guardar categorías
  async saveCategories(categories) {
    await this.init();
    const transaction = this.db.transaction([STORES.CATEGORIES], "readwrite");
    const store = transaction.objectStore(STORES.CATEGORIES);

    const promises = categories.map((category) => store.put(category));
    await Promise.all(promises);

    return categories;
  }

  // Obtener categorías
  async getCategories() {
    await this.init();
    const transaction = this.db.transaction([STORES.CATEGORIES], "readonly");
    const store = transaction.objectStore(STORES.CATEGORIES);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Guardar usuarios
  async saveUsers(users) {
    await this.init();
    const transaction = this.db.transaction([STORES.USERS], "readwrite");
    const store = transaction.objectStore(STORES.USERS);

    // Limpiar el store actual
    await store.clear();

    // Guardar nuevos usuarios
    const promises = users.map((user) => store.put(user));
    await Promise.all(promises);

    return users;
  }

  // Obtener usuarios
  async getUsers() {
    await this.init();
    const transaction = this.db.transaction([STORES.USERS], "readonly");
    const store = transaction.objectStore(STORES.USERS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Guardar carrito
  async saveCart(cartItems) {
    await this.init();
    const transaction = this.db.transaction([STORES.CART], "readwrite");
    const store = transaction.objectStore(STORES.CART);

    // Limpiar el carrito actual
    await store.clear();

    // Guardar nuevos items
    const promises = cartItems.map((item) => store.put(item));
    await Promise.all(promises);

    return cartItems;
  }

  // Obtener carrito
  async getCart() {
    await this.init();
    const transaction = this.db.transaction([STORES.CART], "readonly");
    const store = transaction.objectStore(STORES.CART);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Agregar acción a la cola de sincronización
  async addToSyncQueue(action) {
    await this.init();
    const transaction = this.db.transaction([STORES.SYNC_QUEUE], "readwrite");
    const store = transaction.objectStore(STORES.SYNC_QUEUE);

    const syncItem = {
      ...action,
      timestamp: new Date().toISOString(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const request = store.add(syncItem);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Obtener cola de sincronización
  async getSyncQueue() {
    await this.init();
    const transaction = this.db.transaction([STORES.SYNC_QUEUE], "readonly");
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Eliminar item de la cola de sincronización
  async removeFromSyncQueue(id) {
    await this.init();
    const transaction = this.db.transaction([STORES.SYNC_QUEUE], "readwrite");
    const store = transaction.objectStore(STORES.SYNC_QUEUE);
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Verificar si hay conexión
  isOnline() {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return true; // Asumir online en servidor
    }
    return navigator.onLine;
  }

  // Guardar imagen de platillo
  async saveDishImage(imageData) {
    await this.init();
    const transaction = this.db.transaction([STORES.DISH_IMAGES], "readwrite");
    const store = transaction.objectStore(STORES.DISH_IMAGES);

    // Verificar si la imagen ya existe por URL
    const existingIndex = store.index("url");
    const existingRequest = existingIndex.get(imageData.url);
    
    return new Promise((resolve, reject) => {
      existingRequest.onsuccess = () => {
        if (existingRequest.result) {
          // Actualizar imagen existente
          const updateRequest = store.put({
            ...existingRequest.result,
            ...imageData,
          });
          updateRequest.onsuccess = () => resolve(updateRequest.result);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          // Agregar nueva imagen
          const addRequest = store.add(imageData);
          addRequest.onsuccess = () => resolve(addRequest.result);
          addRequest.onerror = () => reject(addRequest.error);
        }
      };
      existingRequest.onerror = () => reject(existingRequest.error);
    });
  }

  // Obtener imágenes por categoría
  async getDishImagesByCategory(category) {
    await this.init();
    const transaction = this.db.transaction([STORES.DISH_IMAGES], "readonly");
    const store = transaction.objectStore(STORES.DISH_IMAGES);
    const index = store.index("category");
    
    return new Promise((resolve, reject) => {
      const request = index.getAll(category);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Obtener todas las imágenes
  async getAllDishImages() {
    await this.init();
    const transaction = this.db.transaction([STORES.DISH_IMAGES], "readonly");
    const store = transaction.objectStore(STORES.DISH_IMAGES);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // Guardar configuración
  async saveSetting(key, value) {
    await this.init();
    const transaction = this.db.transaction([STORES.SETTINGS], "readwrite");
    const store = transaction.objectStore(STORES.SETTINGS);
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, updatedAt: new Date().toISOString() });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Obtener configuración
  async getSetting(key) {
    await this.init();
    const transaction = this.db.transaction([STORES.SETTINGS], "readonly");
    const store = transaction.objectStore(STORES.SETTINGS);
    
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => reject(request.error);
    });
  }

  // Obtener todas las configuraciones
  async getAllSettings() {
    await this.init();
    const transaction = this.db.transaction([STORES.SETTINGS], "readonly");
    const store = transaction.objectStore(STORES.SETTINGS);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const settings = {};
        request.result.forEach((item) => {
          settings[item.key] = item.value;
        });
        resolve(settings);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Limpiar toda la base de datos (útil para desarrollo)
  async clearAll() {
    await this.init();
    const stores = Object.values(STORES);
    const transaction = this.db.transaction(stores, "readwrite");

    await Promise.all(
      stores.map((storeName) => {
        const store = transaction.objectStore(storeName);
        return store.clear();
      })
    );
  }
}

// Exportar instancia singleton
const indexedDBService = new IndexedDBService();
export default indexedDBService;

