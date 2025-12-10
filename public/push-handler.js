// Handler para notificaciones push - se importará en el service worker

self.addEventListener("push", function (event) {
  console.log("Push event recibido:", event);
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Alien Food", body: event.data.text() || "Tienes una nueva notificación" };
    }
  } else {
    data = { title: "Alien Food", body: "Tienes una nueva notificación" };
  }

  const title = data.title || "Alien Food";
  const options = {
    body: data.body || data.message || "Tienes una nueva notificación",
    icon: data.icon || "/img/favicons/android-chrome-192x192.png",
    badge: data.badge || "/img/favicons/android-chrome-192x192.png",
    data: data.data || { url: "/" },
    requireInteraction: false,
    tag: data.tag || "alien-food-notification",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  console.log("Notification click recibido:", event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

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

