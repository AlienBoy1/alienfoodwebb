// Utilidad para limpiar el caché del service worker y forzar actualización
export async function clearServiceWorkerCache() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    // Obtener todos los registros de service workers
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    // Desregistrar todos los service workers
    for (const registration of registrations) {
      await registration.unregister();
      console.log('✅ Service Worker desregistrado:', registration.scope);
    }

    // Limpiar todos los cachés
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('✅ Caché eliminado:', cacheName);
      }
    }

    // Limpiar IndexedDB (opcional, pero recomendado para forzar actualización completa)
    if ('indexedDB' in window) {
      try {
        const dbName = 'TunelDelTiempoDB';
        const deleteReq = indexedDB.deleteDatabase(dbName);
        await new Promise((resolve, reject) => {
          deleteReq.onsuccess = () => resolve();
          deleteReq.onerror = () => reject(deleteReq.error);
          deleteReq.onblocked = () => {
            console.warn('⚠️ IndexedDB bloqueado, puede que haya pestañas abiertas');
            resolve(); // Continuar de todos modos
          };
        });
        console.log('✅ IndexedDB eliminado:', dbName);
      } catch (error) {
        console.warn('⚠️ Error eliminando IndexedDB:', error);
      }
    }

    // Limpiar localStorage de la app antigua
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('AlienFood') || key.startsWith('alienfood'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log('✅ LocalStorage eliminado:', key);
      });
    } catch (error) {
      console.warn('⚠️ Error limpiando localStorage:', error);
    }

    console.log('✅ Caché limpiado completamente. Recargando página...');
    
    // Recargar la página después de limpiar
    setTimeout(() => {
      window.location.reload(true);
    }, 500);
  } catch (error) {
    console.error('❌ Error limpiando caché:', error);
  }
}

// Función para verificar y limpiar caché si es necesario
export async function checkAndClearOldCache() {
  if (typeof window === 'undefined') {
    return;
  }

  // Verificar si hay un service worker antiguo registrado
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      // Verificar si el service worker está sirviendo contenido antiguo
      const sw = registration.active || registration.waiting || registration.installing;
      if (sw) {
        // Si el service worker tiene un script que menciona "Alien Food", limpiar
        const swScript = await fetch(sw.scriptURL).then(r => r.text()).catch(() => '');
        if (swScript.includes('Alien Food') || swScript.includes('alienfood')) {
          console.log('⚠️ Detectado service worker antiguo, limpiando caché...');
          await clearServiceWorkerCache();
          return;
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ Error verificando service worker:', error);
  }
}

