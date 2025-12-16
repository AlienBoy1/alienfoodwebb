import { useState, useEffect } from "react";
import { useSession } from "next-auth/client";
import { useRouter } from "next/router";
import useSWR from "swr";
import { BellIcon, CheckIcon, XIcon, ArrowLeftIcon } from "@heroicons/react/outline";
import axios from "axios";
import NormalToast from "../util/Toast/NormalToast";
import moment from "moment";
import Layout from "../components/Layout/Layout";

function NotificationsPage() {
  const [session, loading] = useSession();
  const router = useRouter();
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

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-light mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-3 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.back()}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Volver"
                >
                  <ArrowLeftIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BellIcon className="w-7 h-7 text-primary-light" />
                    Notificaciones
                  </h1>
                  {unreadCount > 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {unreadCount} {unreadCount === 1 ? "notificación no leída" : "notificaciones no leídas"}
                    </p>
                  )}
                </div>
              </div>
              {safeNotifications.length > 0 && unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
                >
                  Registrar notificaciones como recibidas
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            {error ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <BellIcon className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>UPS! Algo salió mal</p>
                <button
                  onClick={() => mutate()}
                  className="mt-4 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
                >
                  Volver a intentar
                </button>
              </div>
            ) : !safeNotifications || safeNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <BellIcon className="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {safeNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {notification.title || "TUNEL DEL TIEMPO"}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mt-1">
                              {notification.body || notification.message}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                              {moment(notification.createdAt).format("DD/MM/YYYY HH:mm")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!notification.read && (
                              <span className="w-2 h-2 bg-primary-light rounded-full"></span>
                            )}
                            <button
                              onClick={() => deleteNotification(notification._id)}
                              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                              aria-label="Eliminar notificación"
                            >
                              <XIcon className="w-5 h-5 text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="mt-3 text-sm text-primary-light hover:text-primary-dark font-medium"
                          >
                            Marcar como leída
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default NotificationsPage;

