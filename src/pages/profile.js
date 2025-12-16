import { useState, useEffect } from "react";
import { useSession } from "next-auth/client";
import { signIn } from "next-auth/client";
import Head from "next/head";
import BackButton from "../components/BackButton/BackButton";
import axios from "axios";
import NormalToast from "../util/Toast/NormalToast";
import { PencilIcon, CheckIcon, XIcon } from "@heroicons/react/outline";
import { getAllProfileImages } from "../util/profileImages";

function Profile() {
  const [session, loading] = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    image: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingUpdateData, setPendingUpdateData] = useState(null);
  const [profileImages] = useState(getAllProfileImages());

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        username: session.user.username || "",
        email: session.user.email || "",
        password: "",
        image: session.user.image || "",
      });
    }
  }, [session]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    // Preparar datos para confirmación
    const updateData = {
      name: formData.name,
      username: formData.username,
      email: formData.email,
      image: formData.image,
    };

    // Solo incluir password si se proporcionó uno nuevo
    if (formData.password && formData.password.length > 0) {
      if (formData.password.length < 6) {
        NormalToast("La contraseña debe tener al menos 6 caracteres", true);
        return;
      }
      updateData.password = formData.password;
    }

    // Verificar si hay cambios
    const hasChanges = 
      formData.name !== (session?.user?.name || "") ||
      formData.username !== (session?.user?.username || "") ||
      formData.email !== (session?.user?.email || "") ||
      formData.image !== (session?.user?.image || "") ||
      (formData.password && formData.password.length > 0);

    if (!hasChanges) {
      NormalToast("No hay cambios para guardar", true);
      return;
    }

    // Mostrar diálogo de confirmación
    setPendingUpdateData(updateData);
    setShowConfirmDialog(true);
  };

  const confirmSave = async () => {
    if (!pendingUpdateData) return;
    
    setFormLoading(true);
    setShowConfirmDialog(false);
    
    try {
      const response = await axios.put("/api/profile/update", pendingUpdateData);

      if (response.status === 200) {
        NormalToast("Perfil actualizado exitosamente");
        setIsEditing(false);
        setIsEditingImage(false);
        // Recargar la página para actualizar la sesión
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      NormalToast(
        error.response?.data?.message || "Error al actualizar el perfil",
        true
      );
    } finally {
      setFormLoading(false);
      setPendingUpdateData(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsEditingImage(false);
    // Restaurar datos originales
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        username: session.user.username || "",
        email: session.user.email || "",
        password: "",
        image: session.user.image || "",
      });
    }
  };

  const handleImageSelect = (imageUrl) => {
    setFormData({
      ...formData,
      image: imageUrl,
    });
  };

  if (loading) {
    return (
      <div className="heightFix flex items-center justify-center">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>TUNEL DEL TIEMPO | Perfil</title>
      </Head>
      <div className="heightFix px-3 sm:px-6">
        <div className="max-w-screen-xl mx-auto md:py-20 py-8 sm:py-12 space-y-6 sm:space-y-10 pb-16 sm:pb-20">
          <div className="flex items-center gap-4 mb-4">
            <BackButton />
          </div>
          <div className="flex items-center justify-between border-b-2 border-gray-200 pb-4">
            <h3 className="sm:text-2xl text-xl font-semibold text-gray-700">
              Perfil
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 button text-sm"
              >
                <PencilIcon className="w-5 h-5" />
                Editar Perfil
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            {/* Foto de perfil */}
            <div className="flex items-start gap-6">
              <div className="relative">
                <img
                  src={formData.image || session?.user?.image || "/img/profile_pic.svg"}
                  loading="lazy"
                  alt="Foto de perfil"
                  className="object-contain sm:w-32 sm:h-32 w-24 h-24 rounded-full border-4 border-gray-200"
                />
                {isEditing && (
                  <button
                    onClick={() => setIsEditingImage(!isEditingImage)}
                    className="absolute bottom-0 right-0 bg-primary-light text-white rounded-full p-2 hover:bg-primary-dark transition-colors"
                    title="Cambiar foto de perfil"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isEditingImage && (
                <div className="flex-1">
                  <h4 className="font-semibold mb-3 text-gray-700">
                    Seleccionar Foto de Perfil
                  </h4>
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-64 overflow-y-auto p-3 border border-gray-200 rounded-md bg-gray-50">
                    {profileImages.map((imgUrl, index) => (
                      <div
                        key={index}
                        onClick={() => handleImageSelect(imgUrl)}
                        className={`cursor-pointer border-2 rounded-full overflow-hidden transition-all ${
                          formData.image === imgUrl
                            ? "border-primary-light ring-2 ring-primary-light"
                            : "border-gray-300 hover:border-primary-light"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Avatar ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "/img/profile_pic.svg";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Información del usuario */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                    disabled={formLoading}
                  />
                ) : (
                  <p className="text-gray-900">{session?.user?.name || "No especificado"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de Usuario
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                    disabled={formLoading}
                  />
                ) : (
                  <p className="text-gray-900">{session?.user?.username || "No especificado"}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                    disabled={formLoading}
                  />
                ) : (
                  <p className="text-gray-900 break-all">{session?.user?.email || "No especificado"}</p>
                )}
              </div>

              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña (dejar vacío para no cambiar)
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light"
                    disabled={formLoading}
                  />
                </div>
              )}
            </div>

            {/* Botones de acción */}
            {isEditing && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={formLoading}
                  className="flex-1 button flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckIcon className="w-5 h-5" />
                  {formLoading ? "Guardando..." : "Guardar Cambios"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XIcon className="w-5 h-5" />
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diálogo de confirmación */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
              Confirmar Cambios
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              ¿Estás seguro de que deseas actualizar tu información de perfil? 
              Los cambios serán guardados permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmSave}
                disabled={formLoading}
                className="flex-1 button py-2 px-4 disabled:opacity-50"
              >
                {formLoading ? "Guardando..." : "Confirmar"}
              </button>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setPendingUpdateData(null);
                }}
                disabled={formLoading}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

Profile.auth = true;

export default Profile;
