// Utilidad para manejar notificaciones push
import { resetAllPushSubscriptions } from './resetPushSubscriptions';

// Función auxiliar para esperar a que el service worker esté completamente activo y listo
async function waitForServiceWorker(maxAttempts = 15, delay = 800) {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Worker no está disponible");
  }

  // Esperar a que el service worker esté listo
  let registration;
  try {
    registration = await navigator.serviceWorker.ready;
  } catch (e) {
    throw new Error("No se pudo obtener el registro del service worker. Asegúrate de que esté registrado.");
  }
  
  // Verificar que el service worker esté activo con reintentos más largos
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Verificar que esté activo
    if (registration.active) {
      // Verificar que el pushManager esté disponible
      if (registration.pushManager) {
        console.debug(`✅ Service Worker activo y con PushManager después de ${attempt} intentos`);
        // Esperar un momento adicional para asegurar que esté completamente listo
        // Esto es especialmente importante en navegadores como Brave
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verificación final: intentar acceder al pushManager para asegurar que esté funcional
        try {
          const testSubscription = await registration.pushManager.getSubscription();
          console.debug("✅ PushManager verificado y funcional");
        } catch (e) {
          // Si falla, esperar un poco más
          console.debug("⏳ PushManager aún no está completamente listo, esperando...");
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        return registration;
      } else {
        console.debug("Service Worker activo pero PushManager no disponible aún, esperando...");
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
    
    // Si está instalándose, esperar a que termine completamente
    if (registration.installing) {
      console.debug(`⏳ Service Worker instalándose (intento ${attempt + 1}/${maxAttempts}), esperando...`);
      await new Promise((resolve) => {
        const installingWorker = registration.installing;
        let resolved = false;
        
        const stateChangeHandler = () => {
          if (installingWorker.state === 'activated' && !resolved) {
            resolved = true;
            installingWorker.removeEventListener('statechange', stateChangeHandler);
            resolve();
          } else if (installingWorker.state === 'redundant' && !resolved) {
            resolved = true;
            installingWorker.removeEventListener('statechange', stateChangeHandler);
            resolve();
          }
        };
        
        installingWorker.addEventListener('statechange', stateChangeHandler);
        
        // Timeout de seguridad más largo
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            installingWorker.removeEventListener('statechange', stateChangeHandler);
            resolve();
          }
        }, delay * 3);
      });
      
      // Después de que termine de instalar, esperar un momento adicional
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Si está esperando, activarlo
    if (registration.waiting) {
      console.debug("⏸️ Service Worker esperando, activando...");
      try {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        await new Promise(resolve => setTimeout(resolve, delay * 2));
      } catch (e) {
        console.warn("Error activando service worker en espera:", e);
      }
    }
    
    // Esperar antes del siguiente intento (tiempo progresivo)
    if (attempt < maxAttempts - 1) {
      const waitTime = delay + (attempt * 200); // Aumentar el tiempo de espera progresivamente
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  // Si después de todos los intentos no está activo, verificar el estado
  if (!registration.active) {
    console.error("❌ Service Worker no está activo después de múltiples intentos");
    console.error("Estado del registro:", {
      active: registration.active?.scriptURL,
      installing: registration.installing?.state,
      waiting: registration.waiting?.scriptURL,
      hasPushManager: !!registration.pushManager,
    });
    throw new Error("El service worker no está activo después de múltiples intentos. Por favor, recarga la página completamente (Ctrl+F5) y espera unos segundos antes de intentar activar las notificaciones.");
  }
  
  // Verificación final del pushManager
  if (!registration.pushManager) {
    throw new Error("El service worker está activo pero el PushManager no está disponible. Esto puede indicar un problema con el service worker. Intenta recargar la página.");
  }
  
  return registration;
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("Este navegador no soporta notificaciones");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    console.log("Los permisos de notificación fueron denegados");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
}

// Función auxiliar para detectar si estamos en localhost
function isLocalhost() {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.');
}

export async function subscribeToPushNotifications() {
  try {
    // Verificar que el service worker esté disponible
    if (!("serviceWorker" in navigator)) {
      throw new Error("Service Worker no está disponible en este navegador");
    }

    if (!("PushManager" in window)) {
      throw new Error("Push notifications no están disponibles en este navegador");
    }

    // CRÍTICO: Verificar HTTPS en móviles
    const isHTTPS = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isHTTP = typeof window !== 'undefined' && window.location.protocol === 'http:';
    const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && isHTTP) {
      throw new Error(
        "Las notificaciones push requieren HTTPS en dispositivos móviles. " +
        "Para desarrollo local, usa ngrok (ngrok http 3000) o despliega la aplicación en producción con HTTPS."
      );
    }

    // ADVERTENCIA: Edge/Chrome tienen problemas conocidos con push notifications en localhost
    const isLocal = isLocalhost();
    if (isLocal) {
      console.warn("⚠️ Detectado localhost: Edge puede tener problemas con push notifications en desarrollo");
      console.warn("⚠️ Para producción, asegúrate de usar HTTPS");
    }

    // CRÍTICO: Esperar a que el service worker esté completamente listo
    // En Edge/Chrome, el service worker debe tener el listener de push registrado ANTES de suscribirse
    console.debug("⏳ Esperando a que el service worker esté completamente listo...");
    let registration;
    try {
      registration = await waitForServiceWorker(20, 1000); // Más intentos y más tiempo
      console.debug("✅ ServiceWorker ready y activo:", registration);
      
      // CRÍTICO: Verificar que el service worker tenga el listener de push registrado
      // En Edge/Chrome, el listener DEBE estar activo antes de intentar suscribirse
      try {
        const activeWorker = registration.active;
        if (activeWorker) {
          console.debug("📨 Verificando que el service worker esté completamente inicializado...");
          
          // Enviar un mensaje al service worker para verificar que esté listo
          activeWorker.postMessage({ type: 'PUSH_READY_CHECK' });
          
          // Esperar tiempo suficiente para que el service worker procese y registre el listener
          // En Edge, esto es crítico
          console.debug("⏳ Esperando a que el service worker registre el listener de push (2 segundos)...");
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (msgError) {
        console.warn("⚠️ No se pudo verificar el service worker:", msgError);
        // Esperar de todos modos
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (e) {
      throw new Error("No se pudo obtener el registro del service worker. Asegúrate de que esté registrado y activo. Intenta recargar la página completamente (Ctrl+F5) y espera 10 segundos antes de intentar de nuevo.");
    }

    // Verificar que el pushManager esté disponible
    if (!registration.pushManager) {
      throw new Error("PushManager no está disponible en el service worker");
    }

    // Obtener la VAPID public key desde el endpoint de Next.js
    let vapidKey = null;
    try {
      // Usar el endpoint de Next.js primero
      const r = await fetch("/api/push/vapid");
      if (r.ok) {
        const data = await r.json();
        vapidKey = data.publicKey;
        console.debug("Obtenida VAPID public key desde /api/push/vapid");
      } else {
        console.warn("No se pudo obtener VAPID key desde /api/push/vapid, status:", r.status);
      }
    } catch (e) {
      console.warn("Error obteniendo VAPID key desde /api/push/vapid:", e);
      
      // Intentar con el backend externo como fallback
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const r = await fetch(apiBase + "/push/vapid");
        if (r.ok) {
          const data = await r.json();
          vapidKey = data.publicKey;
          console.debug("Obtenida VAPID public key desde backend externo");
        }
      } catch (e2) {
        console.warn("No se pudo obtener VAPID key desde backend externo:", e2);
      }
    }

    if (!vapidKey) {
      // fallback a la variable de entorno si por alguna razón no hay endpoint
      vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (vapidKey) {
        console.debug("Usando VAPID key desde variable de entorno");
      } else {
        throw new Error("No se pudo obtener la clave VAPID. Verifica la configuración del servidor.");
      }
    }

    // Validar que la clave VAPID tenga el formato correcto
    if (!vapidKey || typeof vapidKey !== "string" || vapidKey.length < 80) {
      throw new Error("La clave VAPID no tiene un formato válido");
    }

    // Convertir la clave VAPID con validación exhaustiva
    let applicationServerKey;
    try {
      applicationServerKey = urlBase64ToUint8Array(vapidKey);
      console.debug("✅ VAPID public key convertida correctamente");
      console.debug("VAPID public key (raw, primeros 50 chars):", vapidKey.substring(0, 50) + "...");
      console.debug("VAPID public key (longitud):", vapidKey.length);
      console.debug("ApplicationServerKey (Uint8Array) length:", applicationServerKey.length);

      if (applicationServerKey.length !== 65) {
        console.error(
          "❌ La clave VAPID convertida no tiene la longitud esperada (65). Longitud actual:",
          applicationServerKey.length
        );
        throw new Error(`La clave VAPID no tiene el formato correcto después de la conversión. Longitud: ${applicationServerKey.length}, esperada: 65. Verifica que las VAPID keys estén correctamente configuradas en el servidor.`);
      }
    } catch (conversionError) {
      console.error("❌ Error convirtiendo clave VAPID:", conversionError);
      throw new Error(`Error al procesar la clave VAPID: ${conversionError.message}. Verifica que las VAPID keys estén correctamente configuradas en el servidor.`);
    }

    // Verificar que el pushManager esté disponible y funcional
    if (!registration.pushManager) {
      throw new Error("PushManager no está disponible en el service worker");
    }

    // Verificar que tengamos permisos de notificación antes de suscribirnos
    if (Notification.permission !== "granted") {
      throw new Error("Los permisos de notificación no están concedidos. Por favor, permite las notificaciones primero.");
    }

    // Esperar un momento adicional para asegurar que todo esté completamente listo
    // Esto es especialmente importante en navegadores como Brave que tienen restricciones adicionales
    console.debug("⏳ Esperando a que el service worker esté completamente listo...");
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verificar nuevamente que el service worker esté activo y el pushManager disponible
    if (!registration.active) {
      console.warn("⚠️ Service Worker no está activo, intentando reactivar...");
      registration = await waitForServiceWorker(10, 500);
    }
    
    // Verificación final antes de suscribirse
    if (!registration.active) {
      throw new Error("El service worker no está activo. Por favor, recarga la página completamente (Ctrl+F5) y espera unos segundos antes de intentar activar las notificaciones.");
    }
    
    if (!registration.pushManager) {
      throw new Error("El PushManager no está disponible en el service worker. Esto puede indicar un problema con el service worker. Intenta recargar la página.");
    }
    
    // Verificar que el pushManager esté funcional intentando acceder a él
    try {
      await registration.pushManager.getSubscription();
      console.debug("✅ PushManager verificado y funcional antes de suscribirse");
    } catch (e) {
      console.warn("⚠️ Advertencia al verificar PushManager:", e);
      // Esperar un poco más si hay problemas
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Declarar la variable subscription al inicio
    let subscription = null;

    // CRÍTICO: Limpiar COMPLETAMENTE todas las suscripciones existentes
    // El AbortError en Edge generalmente ocurre por suscripciones corruptas o con keys diferentes
    console.debug("🧹 Limpiando TODAS las suscripciones existentes para evitar conflictos...");
    
    // Usar la función de reset que limpia más agresivamente
    const wasCleaned = await resetAllPushSubscriptions();
    
    if (wasCleaned) {
      console.debug("✅ Suscripciones limpiadas, esperando tiempo adicional (3 segundos)...");
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      // Verificar manualmente si hay suscripciones
      try {
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          console.debug("⚠️ Aún hay una suscripción, cancelándola...");
          await existingSubscription.unsubscribe();
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (e) {
        // No hay suscripción
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Si no hay suscripción válida, crear una nueva
    if (!subscription) {
      // Verificaciones finales antes de intentar suscribirse
      if (!registration.active) {
        throw new Error("El service worker no está activo. Por favor, recarga la página completamente (Ctrl+F5) y espera unos segundos antes de intentar activar las notificaciones.");
      }
      
      if (!registration.pushManager) {
        throw new Error("El PushManager no está disponible. Intenta recargar la página.");
      }

      // Esperar un momento adicional antes de intentar suscribirse
      // Esto ayuda especialmente en navegadores como Brave
      console.debug("⏳ Esperando momento adicional antes de suscribirse...");
      await new Promise(resolve => setTimeout(resolve, 800));

      // Intentar suscribirse con reintentos más largos
      let subscribeAttempts = 0;
      const maxSubscribeAttempts = 5; // Aumentar a 5 intentos
      
      while (subscribeAttempts < maxSubscribeAttempts && !subscription) {
        try {
          console.debug(`🔄 Intento de suscripción ${subscribeAttempts + 1}/${maxSubscribeAttempts}`);
          
          // Verificar permisos antes de cada intento
          if (Notification.permission !== "granted") {
            throw new Error("Los permisos de notificación no están concedidos. Por favor, permite las notificaciones primero.");
          }
          
          // Verificar que el service worker siga activo
          if (!registration.active) {
            console.warn("⚠️ Service Worker dejó de estar activo, reactivando...");
            registration = await waitForServiceWorker(5, 500);
          }
          
          // Verificar que el pushManager siga disponible
          if (!registration.pushManager) {
            throw new Error("El PushManager ya no está disponible. Intenta recargar la página.");
          }

          // CRÍTICO: Verificar que el service worker tenga el listener de push registrado
          // Enviar un mensaje al service worker para asegurar que esté completamente listo
          try {
            const activeWorker = registration.active;
            if (activeWorker) {
              // Enviar un mensaje de prueba al service worker para verificar que esté listo
              activeWorker.postMessage({ type: 'PUSH_READY_CHECK' });
              // Esperar un momento para que el service worker procese el mensaje
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } catch (msgError) {
            console.warn("⚠️ No se pudo verificar el service worker:", msgError);
          }

          // Verificar una última vez que todo esté listo
          if (!registration.active) {
            throw new Error("El service worker no está activo. Por favor, recarga la página.");
          }
          
          if (!registration.pushManager) {
            throw new Error("El PushManager no está disponible.");
          }

          // Verificar que la clave VAPID tenga el formato correcto antes de suscribirse
          if (!applicationServerKey || applicationServerKey.length !== 65) {
            console.error("❌ Clave VAPID inválida:", {
              length: applicationServerKey?.length,
              expected: 65,
            });
            throw new Error("La clave VAPID no tiene el formato correcto. Verifica la configuración del servidor.");
          }

          console.debug("🔑 Intentando suscribirse con clave VAPID:", {
            length: applicationServerKey.length,
            firstBytes: Array.from(applicationServerKey.slice(0, 5)),
            vapidKeyPreview: vapidKey.substring(0, 30) + "...",
          });

          // Verificar una última vez que no haya suscripciones residuales
          // Esto es CRÍTICO para Edge/Chrome que pueden tener suscripciones en caché
          try {
            const existingSub = await registration.pushManager.getSubscription();
            if (existingSub) {
              console.debug("⚠️ Aún hay una suscripción residual, cancelándola forzadamente...");
              try {
                await existingSub.unsubscribe();
                console.debug("✅ Suscripción residual cancelada");
                // Esperar más tiempo después de cancelar
                await new Promise(resolve => setTimeout(resolve, 1500));
              } catch (unsubError) {
                console.warn("⚠️ Error al cancelar suscripción residual:", unsubError);
                // Esperar de todos modos
                await new Promise(resolve => setTimeout(resolve, 1500));
              }
            }
          } catch (checkError) {
            // No hay suscripción, continuar
            console.debug("ℹ️ No hay suscripciones residuales");
          }

          // Esperar un momento adicional antes de suscribirse
          // Esto es crítico para Edge/Chrome que necesitan tiempo para procesar la limpieza
          console.debug("⏳ Esperando momento final antes de suscribirse (1.5 segundos)...");
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Verificar una última vez que todo esté en orden
          if (!registration.active) {
            throw new Error("El service worker no está activo");
          }
          
          if (!registration.pushManager) {
            throw new Error("El PushManager no está disponible");
          }
          
          if (Notification.permission !== "granted") {
            throw new Error("Los permisos de notificación no están concedidos");
          }

          console.debug("✅ Todas las verificaciones finales pasadas");
          console.debug("Estado final antes de suscribirse:", {
            serviceWorkerActive: !!registration.active,
            pushManagerAvailable: !!registration.pushManager,
            notificationPermission: Notification.permission,
            vapidKeyLength: applicationServerKey.length,
            browser: navigator.userAgent.includes("Edg") ? "Edge" : navigator.userAgent.includes("Chrome") ? "Chrome" : "Otro",
          });

          // Intentar suscribirse directamente sin timeout
          // El AbortError en Edge generalmente indica problemas de comunicación con el servicio push
          // que no se pueden resolver con reintentos, así que intentamos una vez con todas las verificaciones
          console.debug("🚀 Intentando suscribirse ahora...");
          
          // CRÍTICO: En localhost, Edge tiene un problema conocido con push notifications
          // Intentar suscribirse con manejo de error específico
          try {
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey,
            });
            console.debug("✅ Suscripción creada exitosamente!");
          } catch (subscribeError) {
            // Si estamos en localhost y es un AbortError, proporcionar mensaje más útil
            if (isLocal && subscribeError.name === 'AbortError') {
              console.error("❌ AbortError en localhost - esto es un problema conocido de Edge");
              console.error("💡 Soluciones:");
              console.error("   1. Usa Chrome o Firefox para desarrollo local");
              console.error("   2. O despliega en HTTPS para producción");
              console.error("   3. O usa un túnel como ngrok para probar push notifications");
              
              // Lanzar error con mensaje más claro
              throw new Error(
                "Edge no soporta push notifications en localhost (problema conocido). " +
                "Soluciones: 1) Usa Chrome/Firefox para desarrollo, 2) Despliega en HTTPS para producción, " +
                "3) Usa un túnel como ngrok (ngrok http 3000) para probar push notifications en desarrollo."
              );
            }
            // Re-lanzar el error si no es el caso específico
            throw subscribeError;
          }
          
          // Validar que la suscripción tenga todos los datos necesarios
          if (!subscription || !subscription.endpoint) {
            throw new Error("La suscripción no tiene endpoint válido");
          }

          const p256dhKey = subscription.getKey('p256dh');
          const authKey = subscription.getKey('auth');
          
          if (!p256dhKey || !authKey) {
            console.warn("⚠️ Suscripción creada pero sin claves completas, intentando nuevamente...");
            try {
              await subscription.unsubscribe();
            } catch (e) {
              // Ignorar errores al cancelar
            }
            subscription = null;
            subscribeAttempts++;
            await new Promise(resolve => setTimeout(resolve, 1000 * subscribeAttempts));
            continue;
          }
          
          console.debug("✅ Suscripción exitosa:", {
            endpoint: subscription.endpoint.substring(0, 50) + "...",
            hasP256dh: !!p256dhKey,
            hasAuth: !!authKey,
          });
          
          break; // Salir del bucle si la suscripción fue exitosa
        } catch (subscribeError) {
          subscribeAttempts++;
          console.error(`❌ Error en pushManager.subscribe (intento ${subscribeAttempts}):`, subscribeError);
          
          // Si es el último intento, lanzar el error con mensaje descriptivo
          if (subscribeAttempts >= maxSubscribeAttempts) {
            let errorMessage = "Error al registrar la suscripción push.";
            
            if (subscribeError.name === "AbortError" || subscribeError.message?.includes("push service error")) {
              // El AbortError en Edge generalmente indica que el navegador no puede comunicarse con el servicio push
              // Esto puede ser por restricciones de red, políticas del navegador, o problemas con el servicio push
              const browser = navigator.userAgent.includes("Edg") ? "Edge" : navigator.userAgent.includes("Chrome") ? "Chrome" : "tu navegador";
              
              errorMessage = `Error al registrar la suscripción push en ${browser}. Esto generalmente indica que el navegador no puede comunicarse con el servicio push. Soluciones: 1) Verifica tu conexión a internet, 2) Asegúrate de que no haya extensiones bloqueando las notificaciones, 3) Intenta en modo incógnito, 4) Verifica la configuración de notificaciones del navegador, 5) Si usas un proxy o VPN, desactívalo temporalmente, 6) Recarga la página completamente (Ctrl+F5) y espera 10 segundos antes de intentar de nuevo.`;
            } else if (subscribeError.name === "NotAllowedError") {
              errorMessage = "Las notificaciones push no están permitidas. Por favor, permite las notificaciones en la configuración de tu navegador.";
            } else if (subscribeError.name === "InvalidStateError") {
              errorMessage = "Ya existe una suscripción activa. Intenta desactivar y volver a activar las notificaciones.";
            } else if (subscribeError.message) {
              errorMessage = `Error al suscribirse: ${subscribeError.message}. Si el problema persiste, intenta recargar la página y espera unos segundos antes de intentar de nuevo.`;
            }
            
            throw new Error(errorMessage);
          }
          
          // Esperar antes del siguiente intento (tiempo exponencial más largo)
          const waitTime = 1500 * (subscribeAttempts + 1); // Esperar más tiempo entre intentos
          console.debug(`⏳ Esperando ${waitTime}ms antes del siguiente intento...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      // Verificar que finalmente tengamos una suscripción válida
      if (!subscription) {
        throw new Error("No se pudo crear la suscripción después de múltiples intentos. Por favor, recarga la página e intenta de nuevo.");
      }
    }

    // Validar que la suscripción tenga todos los datos necesarios antes de enviarla
    if (!subscription || !subscription.endpoint) {
      throw new Error("La suscripción no es válida (falta endpoint)");
    }

    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');
    
    if (!p256dhKey || !authKey) {
      throw new Error("La suscripción no es válida (faltan claves de cifrado)");
    }

    // Convertir la suscripción a un formato serializable para enviar al servidor
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dhKey))),
        auth: btoa(String.fromCharCode(...new Uint8Array(authKey))),
      },
    };

    // Enviar la suscripción al servidor
    // Intentar primero con el endpoint de Next.js
    let response;
    try {
      response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          subscription: subscriptionData, 
          userId: window.__USER_EMAIL__ || null, 
          username: window.__USER_NAME__ || null 
        }),
      });
    } catch (e) {
      console.warn("Error con endpoint de Next.js, intentando con backend externo:", e);
      // Fallback al backend externo
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        response = await fetch(apiBase + "/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            subscription: subscriptionData, 
            userId: window.__USER_EMAIL__ || null, 
            username: window.__USER_NAME__ || null 
          }),
        });
      } catch (e2) {
        throw new Error(`Error al conectar con el servidor: ${e2.message || e2}`);
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Error al guardar la suscripción en el servidor (${response.status})`;
      throw new Error(errorMessage);
    }

    const responseData = await response.json().catch(() => ({}));
    console.debug("✅ Suscripción guardada en el servidor:", responseData);

    return subscription;
  } catch (error) {
    console.error("Error suscribiéndose a notificaciones:", error);
    throw error;
  }
}

export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      // Notify server to remove saved subscription first
      try {
        // Intentar primero con el endpoint de Next.js
        const response = await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        if (!response.ok) {
          // Fallback al backend externo si falla
          const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
          const userId = window.__USER_EMAIL__ || null;
          await fetch(apiBase + "/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint, userId }),
          });
        }
      } catch (fetchError) {
        console.warn("Error notificando al servidor sobre la desuscripción:", fetchError);
        // Continuar con la desuscripción local aunque falle el servidor
      }

      // Unsubscribe in the browser
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error desuscribiéndose de notificaciones:", error);
    throw error;
  }
}

function urlBase64ToUint8Array(base64String) {
  // Asegurar que la cadena base64 esté en el formato correcto
  // Las claves VAPID vienen en formato URL-safe base64
  let base64 = base64String.trim();
  
  // Agregar padding si es necesario
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  base64 = base64 + padding;
  
  // Convertir de URL-safe base64 a base64 estándar
  base64 = base64.replace(/\-/g, "+").replace(/_/g, "/");

  try {
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    // Verificar que la longitud sea correcta (65 bytes para una clave VAPID pública)
    if (outputArray.length !== 65) {
      console.warn(`⚠️ La clave VAPID convertida tiene longitud ${outputArray.length}, se esperaba 65`);
    }
    
    return outputArray;
  } catch (error) {
    console.error("❌ Error convirtiendo VAPID key:", error);
    throw new Error(`Error al convertir la clave VAPID: ${error.message}`);
  }
}

