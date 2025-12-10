import { useState } from "react";
import { BellIcon } from "@heroicons/react/solid";
import axios from "axios";
import useSWR from "swr";
import NormalToast from "../../util/Toast/NormalToast";

function SendNotification() {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    userId: "all",
  });
  const [loading, setLoading] = useState(false);

  // Obtener lista de usuarios para el selector
  const { data: users } = useSWR(
    showModal ? "/api/admin/users" : null
  );

  // Asegurar que users siempre sea un array
  const safeUsers = Array.isArray(users) ? users : [];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post("/api/admin/send-notification", formData);

      if (response.status === 200) {
        NormalToast(
          `Notificaciones enviadas: ${response.data.sent} exitosas, ${response.data.failed} fallidas`
        );
        setFormData({ title: "", message: "", userId: "all" });
        setShowModal(false);
      } else if (response.status === 202 && response.data?.queued) {
        // Petición guardada offline
        NormalToast(
          `📴 Notificación guardada. Se enviará cuando se restablezca la conexión.`
        );
        setFormData({ title: "", message: "", userId: "all" });
        setShowModal(false);
      }
    } catch (error) {
      // Si es un error de red y estamos offline, la petición ya se guardó en la cola
      if (
        (error.message === "Network Error" || 
         error.code === "ERR_INTERNET_DISCONNECTED" ||
         error.message?.includes("ERR_INTERNET_DISCONNECTED")) &&
        typeof window !== "undefined" &&
        !navigator.onLine
      ) {
        NormalToast(
          `📴 Notificación guardada. Se enviará cuando se restablezca la conexión.`
        );
        setFormData({ title: "", message: "", userId: "all" });
        setShowModal(false);
      } else {
        console.error("Error enviando notificación:", error);
        NormalToast(
          error.response?.data?.message || "Error al enviar notificaciones",
          true
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="dashboard-link flex items-center gap-1"
      >
        <BellIcon className="w-4" />
        <span>Enviar Notificación</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Enviar Notificación Push</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                  placeholder="Ej: Nueva oferta disponible"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                  placeholder="Escribe el mensaje de la notificación..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enviar a
                </label>
                <select
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                >
                  <option value="all">Todos los usuarios</option>
                  {safeUsers.map((user) => (
                    <option key={user._id} value={user.email}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                {formData.userId !== "all" && (
                  <p className="mt-1 text-xs text-gray-500">
                    Se enviará solo al usuario seleccionado
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 button disabled:opacity-50"
                >
                  {loading ? "Enviando..." : "Enviar Notificación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default SendNotification;

