// Utilidad para resetear completamente las suscripciones push
// Útil cuando hay errores de AbortError o suscripciones corruptas

export async function resetAllPushSubscriptions() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("Service Worker o PushManager no disponible");
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    
    // Limpiar todas las suscripciones
    let cleaned = false;
    for (let i = 0; i < 5; i++) {
      try {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          console.log(`Limpiando suscripción ${i + 1}...`);
          await subscription.unsubscribe();
          cleaned = true;
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          break;
        }
      } catch (e) {
        break;
      }
    }

    if (cleaned) {
      console.log("✅ Todas las suscripciones limpiadas");
      // Esperar tiempo adicional
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return cleaned;
  } catch (error) {
    console.error("Error reseteando suscripciones:", error);
    return false;
  }
}

