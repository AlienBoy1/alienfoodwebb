// Utilidad para manejar notificaciones push

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

export async function subscribeToPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    console.debug("ServiceWorker ready:", registration);

  // Obtener la VAPID public key desde el servidor en runtime.
    // Esto evita depender de variables de entorno en build-time y facilita pruebas locales.
    let vapidKey = null;
    try {
      // Prefer configured API URL; si no existe, usar por defecto el backend en localhost:5000
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const r = await fetch(apiBase + "/push/vapid");
      if (r.ok) {
        const data = await r.json();
        vapidKey = data.publicKey;
      }
    } catch (e) {
      console.warn("No se pudo obtener VAPID key desde /api/push/vapid:", e);
    }

    if (!vapidKey) {
      // fallback a la variable de entorno si por alguna razón no hay endpoint
      vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        "BEl62iUYgUivxIkv69yViEuiBIa40HIe8vK8vW3aZ3nJjfVDPOMcEMxrBFG6S8u8WQv4fqPLdO1p2J5xYzGm0";
      console.debug("Usando VAPID key fallback (env o literal)");
    } else {
      console.debug("Obtenida VAPID public key desde servidor");
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidKey);
    console.debug("VAPID public key (raw):", vapidKey);
    console.debug("ApplicationServerKey (Uint8Array) length:", applicationServerKey.length);

    if (applicationServerKey.length !== 65) {
      console.warn(
        "La clave VAPID convertida no tiene la longitud esperada (65). Esto puede causar errores al suscribirse a push."
      );
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    // Enviar la suscripción al servidor
    const apiBase2 = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    // include userId and username so backend can associate
    const userId = window.__USER_EMAIL__ || null;
    const username = window.__USER_NAME__ || null;
    const response = await fetch(apiBase2 + "/push/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ subscription, userId, username }),
    });

    if (!response.ok) {
      throw new Error("Error al guardar la suscripción");
    }

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
      // Unsubscribe in the browser
      await subscription.unsubscribe();
      // Notify server to remove saved subscription
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const userId = window.__USER_EMAIL__ || null;
        await fetch(apiBase + '/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint, userId })
        });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error desuscribiéndose de notificaciones:', error);
    throw error;
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
