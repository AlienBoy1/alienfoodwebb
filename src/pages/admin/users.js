import { useState } from "react";
import { useSession } from "next-auth/client";
import Skeleton from "react-loading-skeleton";
import useSWR from "swr";
import Head from "next/head";
import axios from "axios";
import NormalToast from "../../util/Toast/NormalToast";
import { PlusIcon, PencilIcon, TrashIcon, BellIcon } from "@heroicons/react/outline";
import BackButton from "../../components/BackButton/BackButton";

function Users() {
  const [session, loading] = useSession();
  const { data: users, error, mutate } = useSWR(
    !loading && session && session.admin ? "/api/admin/users" : null
  );
  
  // Asegurar que users siempre sea un array
  const safeUsers = Array.isArray(users) ? users : [];
  
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    isAdmin: false,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [notificationData, setNotificationData] = useState({
    title: "",
    message: "",
  });
  const [notificationLoading, setNotificationLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({ name: "", username: "", email: "", password: "", isAdmin: false });
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      password: "",
      isAdmin: user.isAdmin || false,
    });
    setShowModal(true);
  };

  const handleDelete = (user) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (editingUser) {
        // Actualizar usuario
        await axios.put("/api/admin/users", {
          _id: editingUser._id,
          ...formData,
        });
        NormalToast("Usuario actualizado exitosamente");
      } else {
        // Crear usuario
        await axios.post("/api/admin/users", formData);
        NormalToast("Usuario creado exitosamente");
      }
      setShowModal(false);
      mutate(); // Refrescar la lista
    } catch (err) {
      NormalToast(
        err.response?.data?.message || "Error al guardar usuario",
        true
      );
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    setFormLoading(true);
    try {
      await axios.delete("/api/admin/users", {
        data: { _id: deletingUser._id },
      });
      NormalToast("Usuario eliminado exitosamente");
      setShowDeleteModal(false);
      setDeletingUser(null);
      mutate(); // Refrescar la lista
    } catch (err) {
      NormalToast(
        err.response?.data?.message || "Error al eliminar usuario",
        true
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleSendNotification = (user) => {
    setSelectedUser(user);
    setNotificationData({ title: "", message: "" });
    setShowNotificationModal(true);
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setNotificationLoading(true);

    try {
      const response = await axios.post("/api/admin/send-notification", {
        title: notificationData.title,
        message: notificationData.message,
        userId: selectedUser.email,
      });

      if (response.status === 200) {
        NormalToast(
          `Notificación enviada a ${selectedUser.name} exitosamente`
        );
        setShowNotificationModal(false);
        setSelectedUser(null);
        setNotificationData({ title: "", message: "" });
      } else if (response.status === 202 && response.data?.queued) {
        NormalToast(
          `📴 Notificación guardada. Se enviará a ${selectedUser.name} cuando se restablezca la conexión.`
        );
        setShowNotificationModal(false);
        setSelectedUser(null);
        setNotificationData({ title: "", message: "" });
      }
    } catch (error) {
      if (
        (error.message === "Network Error" || 
         error.code === "ERR_INTERNET_DISCONNECTED" ||
         error.message?.includes("ERR_INTERNET_DISCONNECTED")) &&
        typeof window !== "undefined" &&
        !navigator.onLine
      ) {
        NormalToast(
          `📴 Notificación guardada. Se enviará a ${selectedUser.name} cuando se restablezca la conexión.`
        );
        setShowNotificationModal(false);
        setSelectedUser(null);
        setNotificationData({ title: "", message: "" });
      } else {
        console.error("Error enviando notificación:", error);
        NormalToast(
          error.response?.data?.message || "Error al enviar notificación",
          true
        );
      }
    } finally {
      setNotificationLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Alien Food | Usuarios</title>
      </Head>
      <div className="heightFixAdmin bg-gray-100 dark:bg-gray-900 py-6 sm:py-10 px-3 sm:px-6">
        <div className="max-w-screen-xl mx-auto bg-white shadow rounded-md my-6">
          <div className="flex flex-col md:p-8 p-6 bg-white gap-4">
            <div className="flex items-center gap-4 mb-2">
              <BackButton />
            </div>
            <div className="flex justify-between items-center border-b-2 border-gray-200 pb-4">
              <h1 className="sm:text-2xl text-xl font-semibold text-gray-700">
                Usuarios
              </h1>
              <button
                onClick={handleCreate}
                className="button flex items-center gap-2 py-2 px-4"
              >
                <PlusIcon className="w-5 h-5" />
                <span>Agregar Usuario</span>
              </button>
            </div>
            <div className="space-y-4 overflow-auto flex-grow hideScrollBar">
              {!error && !safeUsers ? (
                <Skeleton count={10} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full sm:text-base text-sm">
                    <thead>
                      <tr>
                        <th className="text-left w-1/6 py-4 font-semibold">
                          Pic
                        </th>
                        <th className="text-left w-1/4 py-4 px-4 font-semibold">
                          Nombre
                        </th>
                        <th className="text-left w-1/4 py-4 font-semibold">
                          Usuario
                        </th>
                        <th className="text-left w-1/4 py-4 font-semibold">
                          Email
                        </th>
                        <th className="text-left w-1/6 py-4 font-semibold">
                          Admin
                        </th>
                        <th className="text-left w-1/3 py-4 font-semibold">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="sm:text-sm text-xs">
                      {safeUsers.map((user) => (
                        <tr key={`user-${user?._id}`}>
                          <td className="table_col_img">
                            <img
                              src={user?.image || "/img/profile_pic.svg"}
                              className="object-contain w-10 rounded-sm py-2"
                              alt=""
                            />
                          </td>
                          <td className="table_col px-4">{user?.name}</td>
                          <td className="table_col">{user?.username}</td>
                          <td className="table_col">{user?.email}</td>
                          <td className="table_col">
                            {user?.isAdmin ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">
                                Admin
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                Usuario
                              </span>
                            )}
                          </td>
                          <td className="table_col">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSendNotification(user)}
                                className="text-green-600 hover:text-green-800"
                                title="Enviar Notificación"
                              >
                                <BellIcon className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleEdit(user)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Editar"
                              >
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              {user?.email !== session?.user?.email && (
                                <button
                                  onClick={() => handleDelete(user)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Eliminar"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para crear/editar usuario */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingUser ? "Editar Usuario" : "Crear Usuario"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña {editingUser && "(dejar vacío para no cambiar)"}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isAdmin"
                  name="isAdmin"
                  checked={formData.isAdmin}
                  onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                  disabled={editingUser && editingUser.email === session?.user?.email}
                  className="w-4 h-4 text-primary-light border-gray-300 rounded focus:ring-primary-light"
                />
                <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700">
                  Administrador
                </label>
                {editingUser && editingUser.email === session?.user?.email && (
                  <span className="text-xs text-gray-500">(No puedes cambiar tu propio estado)</span>
                )}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 button disabled:opacity-50"
                >
                  {formLoading
                    ? "Guardando..."
                    : editingUser
                    ? "Actualizar"
                    : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Confirmar Eliminación</h2>
            <p className="mb-4">
              ¿Estás seguro de que deseas eliminar al usuario{" "}
              <strong>{deletingUser?.name}</strong> ({deletingUser?.email})?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingUser(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={formLoading}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={formLoading}
                className="flex-1 button-red disabled:opacity-50"
              >
                {formLoading ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para enviar notificación a usuario específico */}
      {showNotificationModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">
              Enviar Notificación a {selectedUser.name}
            </h2>
            
            <form onSubmit={handleNotificationSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título
                </label>
                <input
                  type="text"
                  name="title"
                  value={notificationData.title}
                  onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
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
                  value={notificationData.message}
                  onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                  placeholder="Escribe el mensaje de la notificación..."
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Enviar a:</strong> {selectedUser.name} ({selectedUser.email})
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationModal(false);
                    setSelectedUser(null);
                    setNotificationData({ title: "", message: "" });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={notificationLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={notificationLoading}
                  className="flex-1 button disabled:opacity-50"
                >
                  {notificationLoading ? "Enviando..." : "Enviar Notificación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

Users.admin = true;
export default Users;
