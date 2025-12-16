// Utilidades para manejar push notifications
// Incluye funciones para suscribirse, desuscribirse y manejar notificaciones

/**
 * Espera a que el service worker esté completamente listo
 */
async function waitForServiceWorker(maxAttempts = 20, delayMs = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.active) {
        return registration;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Service Worker no está disponible después de múltiples intentos");
}

/**
 * Renueva automáticamente una suscripción expirada
 */
async function renewExpiredSubscription(userId) {
  try {
    console.log(`🔄 Intentando renovar suscripción expirada para ${userId}`);
    
    // Obtener el service worker
    const registration = await navigator.serviceWorker.ready;
    
    // Cancelar suscripción antigua si existe
    const oldSubscription = await registration.pushManager.getSubscription();
    if (oldSubscription) {
      try {
        await oldSubscription.unsubscribe();
        console.log("✅ Suscripción antigua cancelada");
      } catch (e) {
        console.warn("⚠️ Error cancelando suscripción antigua:", e);
      }
    }
    
    // Esperar un momento
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Obtener nueva clave VAPID
    const vapidResponse = await fetch("/api/push/vapid");
    if (!vapidResponse.ok) {
      throw new Error("No se pudo obtener la clave VAPID");
    }
    const { publicKey } = await vapidResponse.json();
    
    // Convertir la clave a Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    
    // Crear nueva suscripción
    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
    
    // Enviar nueva suscripción al servidor
    const subscribeResponse = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription: {
          endpoint: newSubscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(newSubscription.getKey("p256dh")),
            auth: arrayBufferToBase64(newSubscription.getKey("auth")),
          },
        },
      }),
    });
    
    if (subscribeResponse.ok) {
      console.log("✅ Suscripción renovada exitosamente");
      return true;
    } else {
      throw new Error("Error al guardar la nueva suscripción");
    }
  } catch (error) {
    console.error("❌ Error renovando suscripción:", error);
    return false;
  }
}

/**
 * Convierte una URL base64 a Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Convierte un ArrayBuffer a base64
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Solicita permisos de notificación
 */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    throw new Error("Este navegador no soporta notificaciones");
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    throw new Error("Los permisos de notificación están denegados. Por favor, habilítalos en la configuración de tu navegador.");
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
    console.debug("⏳ Esperando a que el service worker esté completamente listo...");
    let registration;
    try {
      registration = await waitForServiceWorker(20, 1000);
      console.debug("✅ ServiceWorker ready y activo:", registration);
      
      // CRÍTICO: Verificar que el service worker tenga el listener de push registrado
      try {
        const activeWorker = registration.active;
        if (activeWorker) {
          console.debug("📨 Verificando que el service worker esté completamente inicializado...");
          
          // Enviar un mensaje al service worker para verificar que esté listo
          activeWorker.postMessage({ type: 'PUSH_READY_CHECK' });
          
          // Esperar tiempo suficiente para que el service worker procese y registre el listener
          console.debug("⏳ Esperando a que el service worker registre el listener de push (2 segundos)...");
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (msgError) {
        console.warn("⚠️ No se pudo verificar el service worker:", msgError);
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
    }

    if (!vapidKey) {
      throw new Error("No se pudo obtener la clave VAPID. Verifica la configuración del servidor.");
    }

    // Convertir la clave VAPID a Uint8Array
    const applicationServerKey = urlBase64ToUint8Array(vapidKey);

    // Verificar que la clave tenga el formato correcto
    if (!applicationServerKey || applicationServerKey.length !== 65) {
      throw new Error("La clave VAPID no tiene el formato correcto");
    }

    // Verificar una última vez que todo esté listo
    if (!registration.active) {
      throw new Error("El service worker no está activo");
    }
    
    if (!registration.pushManager) {
      throw new Error("El PushManager no está disponible");
    }
    
    if (Notification.permission !== "granted") {
      throw new Error("Los permisos de notificación no están concedidos");
    }

    // Intentar suscribirse
    console.debug("🚀 Intentando suscribirse ahora...");
    let subscription;
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      console.debug("✅ Suscripción creada exitosamente!");
    } catch (subscribeError) {
      if (isLocal && subscribeError.name === 'AbortError') {
        throw new Error(
          "Error al suscribirse (problema conocido en localhost). " +
          "Soluciones: 1) Usa Chrome o Firefox para desarrollo, 2) Despliega en HTTPS para producción, " +
          "3) Usa ngrok para crear un túnel HTTPS (ngrok http 3000)"
        );
      }
      throw subscribeError;
    }

    // Convertir la suscripción a formato JSON para enviarla al servidor
    const subscriptionJson = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
        auth: arrayBufferToBase64(subscription.getKey("auth")),
      },
    };

    // Enviar la suscripción al servidor
    const userId = window.__USER_EMAIL__ || null;
    if (!userId) {
      throw new Error("No se pudo obtener el ID del usuario. Asegúrate de estar autenticado.");
    }

    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription: subscriptionJson,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al guardar la suscripción en el servidor");
    }

    console.debug("✅ Suscripción guardada en el servidor");
    return subscription;
  } catch (error) {
    console.error("❌ Error suscribiéndose a push notifications:", error);
    throw error;
  }
}

/**
 * Desuscribe de las notificaciones push
 */
export async function unsubscribeFromPushNotifications() {
  try {
    if (!("serviceWorker" in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return false;
    }

    // Desuscribirse localmente
    await subscription.unsubscribe();

    // Notificar al servidor (opcional, pero recomendado)
    try {
      const userId = window.__USER_EMAIL__ || null;
      if (userId) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
          }),
        });
      }
    } catch (error) {
      console.warn("Error notificando al servidor sobre la desuscripción:", error);
      // No fallar si el servidor no responde
    }

    return true;
  } catch (error) {
    console.error("Error desuscribiéndose:", error);
    return false;
  }
}

/**
 * Verifica y renueva suscripciones expiradas automáticamente
 */
export async function checkAndRenewSubscriptions() {
  try {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Si no hay suscripción, intentar suscribirse automáticamente si hay permisos
      if (Notification.permission === "granted") {
        const userId = window.__USER_EMAIL__;
        if (userId) {
          console.log("🔄 No hay suscripción activa, intentando suscribirse automáticamente...");
          try {
            await subscribeToPushNotifications();
            console.log("✅ Suscripción renovada automáticamente");
          } catch (error) {
            console.warn("⚠️ No se pudo renovar la suscripción automáticamente:", error);
          }
        }
      }
      return;
    }

    // Verificar si la suscripción es válida haciendo una prueba
    // (esto se hace mejor en el servidor cuando se detecta un 410)
    console.debug("✅ Suscripción activa encontrada");
  } catch (error) {
    console.error("Error verificando suscripciones:", error);
  }
}

// Exportar función de renovación para uso externo
export { renewExpiredSubscription };
