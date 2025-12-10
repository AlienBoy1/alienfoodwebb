import { useState, useEffect } from "react";
import { useSession } from "next-auth/client";
import Head from "next/head";
import BackButton from "../components/BackButton/BackButton";
import { useTheme } from "../contexts/ThemeContext";
import { 
  MoonIcon, 
  SunIcon, 
  ColorSwatchIcon, 
  AdjustmentsIcon,
  SparklesIcon,
  XIcon,
  CheckIcon
} from "@heroicons/react/outline";
import NormalToast from "../util/Toast/NormalToast";

function Settings() {
  const [session] = useSession();
  const {
    theme,
    colorScheme,
    fontSize,
    animationsEnabled,
    loading,
    updateTheme,
    updateColorScheme,
    updateFontSize,
    updateAnimations,
  } = useTheme();

  const [saving, setSaving] = useState(false);

  const colorSchemes = [
    { id: "default", name: "Por Defecto", color: "#ab3c2a" },
    { id: "blue", name: "Azul", color: "#3b82f6" },
    { id: "green", name: "Verde", color: "#10b981" },
    { id: "purple", name: "Morado", color: "#8b5cf6" },
    { id: "orange", name: "Naranja", color: "#f97316" },
  ];

  const fontSizes = [
    { id: "small", name: "Pequeño", size: "14px" },
    { id: "medium", name: "Mediano", size: "16px" },
    { id: "large", name: "Grande", size: "18px" },
    { id: "xlarge", name: "Muy Grande", size: "20px" },
  ];

  const handleThemeChange = async (newTheme) => {
    setSaving(true);
    try {
      await updateTheme(newTheme);
      NormalToast(`Tema cambiado a ${newTheme === "dark" ? "oscuro" : "claro"}`);
    } catch (error) {
      NormalToast("Error al cambiar el tema", true);
    } finally {
      setSaving(false);
    }
  };

  const handleColorSchemeChange = async (newScheme) => {
    setSaving(true);
    try {
      await updateColorScheme(newScheme);
      const schemeName = colorSchemes.find((s) => s.id === newScheme)?.name || newScheme;
      NormalToast(`Esquema de colores cambiado a ${schemeName}`);
    } catch (error) {
      NormalToast("Error al cambiar el esquema de colores", true);
    } finally {
      setSaving(false);
    }
  };

  const handleFontSizeChange = async (newSize) => {
    setSaving(true);
    try {
      await updateFontSize(newSize);
      const sizeName = fontSizes.find((s) => s.id === newSize)?.name || newSize;
      NormalToast(`Tamaño de fuente cambiado a ${sizeName}`);
      // Aplicar inmediatamente sin recargar
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty("--font-size-base", fontSizes.find((s) => s.id === newSize)?.size || "16px");
      }
    } catch (error) {
      NormalToast("Error al cambiar el tamaño de fuente", true);
    } finally {
      setSaving(false);
    }
  };

  const handleAnimationsChange = async (enabled) => {
    setSaving(true);
    try {
      await updateAnimations(enabled);
      NormalToast(`Animaciones ${enabled ? "activadas" : "desactivadas"}`);
    } catch (error) {
      NormalToast("Error al cambiar las animaciones", true);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="heightFix flex items-center justify-center">
        <div className="text-center">Cargando configuraciones...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Alien Food | Configuración</title>
      </Head>
      <div className="heightFix px-3 sm:px-6">
        <div className="max-w-screen-xl mx-auto md:py-20 py-8 sm:py-12 space-y-6 sm:space-y-10 pb-16 sm:pb-20">
          <div className="flex items-center gap-4 mb-4">
            <BackButton />
          </div>
          <h3 className="sm:text-2xl text-xl font-semibold border-b-2 border-gray-200 dark:border-gray-700 pb-4 text-gray-700 dark:text-gray-200">
            Configuración
          </h3>

          <div className="space-y-8">
            {/* Tema Claro/Oscuro */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                {theme === "dark" ? (
                  <MoonIcon className="w-6 h-6 text-primary-light" />
                ) : (
                  <SunIcon className="w-6 h-6 text-primary-light" />
                )}
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Tema
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Elige entre tema claro u oscuro para la aplicación
              </p>
              <div className="flex gap-3 sm:gap-4">
                <button
                  onClick={() => handleThemeChange("light")}
                  disabled={saving || theme === "light"}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    theme === "light"
                      ? "border-primary-light bg-primary-light bg-opacity-10"
                      : "border-gray-300 dark:border-gray-600 hover:border-primary-light"
                  } ${saving ? "opacity-50" : ""}`}
                >
                  <SunIcon className="w-8 h-8 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Claro
                  </span>
                </button>
                <button
                  onClick={() => handleThemeChange("dark")}
                  disabled={saving || theme === "dark"}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    theme === "dark"
                      ? "border-primary-light bg-primary-light bg-opacity-10"
                      : "border-gray-300 dark:border-gray-600 hover:border-primary-light"
                  } ${saving ? "opacity-50" : ""}`}
                >
                  <MoonIcon className="w-8 h-8 mx-auto mb-2 text-gray-700 dark:text-gray-300" />
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Oscuro
                  </span>
                </button>
              </div>
            </div>

            {/* Esquema de Colores */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <ColorSwatchIcon className="w-6 h-6 text-primary-light" />
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Paleta de Colores
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Personaliza los colores principales de la aplicación
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                {colorSchemes.map((scheme) => (
                  <button
                    key={scheme.id}
                    onClick={() => handleColorSchemeChange(scheme.id)}
                    disabled={saving}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      colorScheme === scheme.id
                        ? "border-primary-light ring-2 ring-primary-light"
                        : "border-gray-300 dark:border-gray-600 hover:border-primary-light"
                    } ${saving ? "opacity-50" : ""}`}
                  >
                    <div
                      className="w-full h-12 rounded mb-2"
                      style={{ backgroundColor: scheme.color }}
                    />
                    <span className="block text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                      {scheme.name}
                    </span>
                    {colorScheme === scheme.id && (
                      <div className="absolute top-2 right-2 bg-primary-light rounded-full p-1">
                        <CheckIcon className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tamaño de Fuente */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <AdjustmentsIcon className="w-6 h-6 text-primary-light" />
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Tamaño de Fuente
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Ajusta el tamaño del texto para una mejor legibilidad
              </p>
              <div className="space-y-2">
                {fontSizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => handleFontSizeChange(size.id)}
                    disabled={saving}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      fontSize === size.id
                        ? "border-primary-light bg-primary-light bg-opacity-10"
                        : "border-gray-300 dark:border-gray-600 hover:border-primary-light"
                    } ${saving ? "opacity-50" : ""}`}
                    style={{ fontSize: size.size }}
                  >
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {size.name} - {size.size}
                    </span>
                    {fontSize === size.id && (
                      <CheckIcon className="w-5 h-5 text-primary-light float-right" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Animaciones */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <SparklesIcon className="w-6 h-6 text-primary-light" />
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Animaciones
                </h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Activa o desactiva las animaciones de la interfaz
              </p>
              <div className="flex items-center justify-between p-4 rounded-lg border border-gray-300 dark:border-gray-600">
                <span className="text-gray-700 dark:text-gray-300">
                  {animationsEnabled ? "Animaciones activadas" : "Animaciones desactivadas"}
                </span>
                <button
                  onClick={() => handleAnimationsChange(!animationsEnabled)}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    animationsEnabled ? "bg-primary-light" : "bg-gray-300 dark:bg-gray-600"
                  } ${saving ? "opacity-50" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      animationsEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Nota:</strong> Todas las configuraciones se guardan localmente y funcionan
                tanto en línea como sin conexión. Tus preferencias se mantendrán incluso después de
                cerrar la aplicación.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

Settings.auth = true;

export default Settings;

