import { useState, useEffect } from "react";
import { useSession } from "next-auth/client";
import useSWR from "swr";
import { BellIcon, CheckIcon, XIcon } from "@heroicons/react/outline";
import axios from "axios";
import NormalToast from "../../util/Toast/NormalToast";
import moment from "moment";

function Notifications() {
  const [session] = useSession();
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: notifications, error, mutate } = useSWR(
    session ? "/api/notifications" : null
  );

  // Asegurar que notifications siempre sea un array
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  useEffect(() => {
    if (safeNotifications && safeNotifications.length > 0) {
      const unread = safeNotifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } else {
      setUnreadCount(0);
    }
  }, [safeNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await axios.post("/api/notifications", {
        notificationId,
        read: true,
      });
      mutate();
    } catch (error) {
      console.error("Error marcando notificación como leída:", error);
      NormalToast("Error al actualizar notificación", true);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put("/api/notifications");
      mutate();
      NormalToast("Todas las notificaciones marcadas como leídas");
    } catch (error) {
      console.error("Error marcando todas como leídas:", error);
      NormalToast("Error al actualizar notificaciones", true);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axios.delete("/api/notifications", {
        data: { notificationId },
      });
      mutate();
      NormalToast("Notificación eliminada");
    } catch (error) {
      console.error("Error eliminando notificación:", error);
      NormalToast("Error al eliminar notificación", true);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-700 hover:text-primary-light transition-colors"
        title="Notificaciones"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowPanel(false)}
          />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl z-50 border border-gray-200 max-h-96 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Notificaciones</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary-light hover:underline"
                >
                  Marcar todas como leídas
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {error ? (
                <div className="p-4 text-center text-gray-500">
                  Error al cargar notificaciones
                </div>
              ) : !safeNotifications || safeNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <BellIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No tienes notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {safeNotifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.body}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {moment(notification.createdAt).fromNow()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Marcar como leída"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Eliminar"
                          >
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Notifications;

