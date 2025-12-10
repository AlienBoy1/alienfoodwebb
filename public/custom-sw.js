// Service Worker personalizado para manejar notificaciones push

self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Alien Food";
  const options = {
    body: data.body || "Tienes una nueva notificación",
    icon: data.icon || "/img/favicons/android-chrome-192x192.png",
    badge: data.badge || "/img/favicons/android-chrome-192x192.png",
    data: data.data || {},
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const urlToOpen = event.notification.data.url || "/";

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

