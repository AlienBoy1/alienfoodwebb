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
  CheckIcon,
  BellIcon,
  GlobeAltIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  CogIcon,
  InformationCircleIcon
} from "@heroicons/react/outline";
import { 
  BellIcon as BellIconSolid,
  GlobeAltIcon as GlobeAltIconSolid
} from "@heroicons/react/solid";
import NormalToast from "../util/Toast/NormalToast";
import Fade from "react-reveal/Fade";

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [language, setLanguage] = useState("es");
  const [currency, setCurrency] = useState("MXN");

  useEffect(() => {
    // Cargar preferencias guardadas
    if (typeof window !== "undefined") {
      const savedNotifications = localStorage.getItem("notificationsEnabled") === "true";
      const savedLanguage = localStorage.getItem("language") || "es";
      const savedCurrency = localStorage.getItem("currency") || "MXN";
      setNotificationsEnabled(savedNotifications);
      setLanguage(savedLanguage);
      setCurrency(savedCurrency);
    }
  }, []);

  const colorSchemes = [
    { id: "default", name: "Túnel del Tiempo", color: "#6366f1", gradient: "from-indigo-500 to-purple-500" },
    { id: "blue", name: "Azul Clásico", color: "#3b82f6", gradient: "from-blue-500 to-blue-600" },
    { id: "green", name: "Verde Naturaleza", color: "#10b981", gradient: "from-green-500 to-emerald-600" },
    { id: "purple", name: "Morado Épico", color: "#8b5cf6", gradient: "from-purple-500 to-purple-600" },
    { id: "orange", name: "Naranja Retro", color: "#f97316", gradient: "from-orange-500 to-red-500" },
    { id: "pink", name: "Rosa Vibrante", color: "#ec4899", gradient: "from-pink-500 to-rose-500" },
    { id: "red", name: "Rojo Intenso", color: "#ef4444", gradient: "from-red-500 to-red-600" },
    { id: "teal", name: "Verde Azulado", color: "#14b8a6", gradient: "from-teal-500 to-teal-600" },
    { id: "cyan", name: "Cian Brillante", color: "#06b6d4", gradient: "from-cyan-500 to-cyan-600" },
    { id: "amber", name: "Ámbar Dorado", color: "#f59e0b", gradient: "from-amber-500 to-amber-600" },
    { id: "emerald", name: "Esmeralda", color: "#10b981", gradient: "from-emerald-500 to-emerald-600" },
    { id: "indigo", name: "Índigo Profundo", color: "#6366f1", gradient: "from-indigo-500 to-indigo-600" },
    { id: "violet", name: "Violeta", color: "#8b5cf6", gradient: "from-violet-500 to-violet-600" },
    { id: "rose", name: "Rosa Suave", color: "#f43f5e", gradient: "from-rose-500 to-rose-600" },
    { id: "sky", name: "Cielo Azul", color: "#0ea5e9", gradient: "from-sky-500 to-sky-600" },
  ];

  const fontSizes = [
    { id: "small", name: "Pequeño", size: "14px", desc: "Más contenido visible" },
    { id: "medium", name: "Mediano", size: "16px", desc: "Tamaño estándar" },
    { id: "large", name: "Grande", size: "18px", desc: "Mejor legibilidad" },
    { id: "xlarge", name: "Muy Grande", size: "20px", desc: "Máxima legibilidad" },
  ];

  const languages = [
    { id: "es", name: "Español", flag: "🇪🇸" },
    { id: "en", name: "English", flag: "🇺🇸" },
  ];

  const currencies = [
    { id: "MXN", name: "Peso Mexicano", symbol: "$" },
    { id: "USD", name: "Dólar Estadounidense", symbol: "$" },
    { id: "EUR", name: "Euro", symbol: "€" },
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

  const handleNotificationsChange = (enabled) => {
    setNotificationsEnabled(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem("notificationsEnabled", enabled.toString());
    }
    NormalToast(`Notificaciones ${enabled ? "activadas" : "desactivadas"}`);
    
    if (enabled && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (typeof window !== "undefined") {
      localStorage.setItem("language", newLanguage);
    }
    NormalToast(`Idioma cambiado`);
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    if (typeof window !== "undefined") {
      localStorage.setItem("currency", newCurrency);
    }
    NormalToast(`Moneda cambiada`);
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
        <title>TUNEL DEL TIEMPO | Configuración</title>
      </Head>
      <div className="heightFix px-3 sm:px-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-screen-xl mx-auto md:py-20 py-8 sm:py-12 space-y-6 sm:space-y-10 pb-16 sm:pb-20">
          <div className="flex items-center gap-4 mb-4">
            <BackButton />
          </div>
          <Fade bottom>
            <div className="flex items-center gap-3 mb-8">
              <CogIcon className="w-8 h-8 text-primary-light" />
              <h3 className="sm:text-3xl text-2xl font-bold text-gray-800 dark:text-gray-200">
                Configuración
              </h3>
            </div>
          </Fade>

          <div className="space-y-6">
            {/* Información del Usuario */}
            <Fade bottom delay={100}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <UserCircleIcon className="w-6 h-6 text-primary-light" />
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Información del Usuario
                  </h4>
                </div>
                {session?.user && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={session.user.image || "/img/profile_pic.svg"}
                        alt={session.user.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                          {session.user.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Fade>

            {/* Tema Claro/Oscuro */}
            <Fade bottom delay={200}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
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
                <div className="flex gap-4">
                  <button
                    onClick={() => handleThemeChange("light")}
                    disabled={saving || theme === "light"}
                    className={`flex-1 p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                      theme === "light"
                        ? "border-primary-light bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700"
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
                    className={`flex-1 p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                      theme === "dark"
                        ? "border-primary-light bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700"
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
            </Fade>

            {/* Esquema de Colores */}
            <Fade bottom delay={300}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <ColorSwatchIcon className="w-6 h-6 text-primary-light" />
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Paleta de Colores
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Personaliza los colores principales de la aplicación
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {colorSchemes.map((scheme) => (
                    <button
                      key={scheme.id}
                      onClick={() => handleColorSchemeChange(scheme.id)}
                      disabled={saving}
                      className={`relative p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                        colorScheme === scheme.id
                          ? "border-primary-light ring-2 ring-primary-light"
                          : "border-gray-300 dark:border-gray-600 hover:border-primary-light"
                      } ${saving ? "opacity-50" : ""}`}
                    >
                      <div
                        className={`w-full h-12 rounded mb-2 bg-gradient-to-r ${scheme.gradient}`}
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
            </Fade>

            {/* Tamaño de Fuente */}
            <Fade bottom delay={400}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
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
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left transform hover:scale-[1.02] ${
                        fontSize === size.id
                          ? "border-primary-light bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700"
                          : "border-gray-300 dark:border-gray-600 hover:border-primary-light"
                      } ${saving ? "opacity-50" : ""}`}
                      style={{ fontSize: size.size }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300 block">
                            {size.name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {size.desc}
                          </span>
                        </div>
                        {fontSize === size.id && (
                          <CheckIcon className="w-5 h-5 text-primary-light" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Fade>

            {/* Notificaciones */}
            <Fade bottom delay={500}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  {notificationsEnabled ? (
                    <BellIconSolid className="w-6 h-6 text-primary-light" />
                  ) : (
                    <BellIcon className="w-6 h-6 text-primary-light" />
                  )}
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Notificaciones
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Recibe notificaciones sobre nuevos productos, ofertas y actualizaciones
                </p>
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 block">
                      {notificationsEnabled ? "Notificaciones activadas" : "Notificaciones desactivadas"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {notificationsEnabled ? "Recibirás alertas importantes" : "No recibirás notificaciones"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleNotificationsChange(!notificationsEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationsEnabled ? "bg-primary-light" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationsEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </Fade>

            {/* Idioma */}
            <Fade bottom delay={600}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <GlobeAltIcon className="w-6 h-6 text-primary-light" />
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Idioma
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Selecciona tu idioma preferido
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {languages.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id)}
                      className={`p-4 rounded-lg border-2 transition-all transform hover:scale-105 ${
                        language === lang.id
                          ? "border-primary-light bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700"
                          : "border-gray-300 dark:border-gray-600 hover:border-primary-light"
                      }`}
                    >
                      <div className="text-2xl mb-2">{lang.flag}</div>
                      <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {lang.name}
                      </span>
                      {language === lang.id && (
                        <CheckIcon className="w-5 h-5 text-primary-light mx-auto mt-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </Fade>

            {/* Moneda */}
            <Fade bottom delay={700}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheckIcon className="w-6 h-6 text-primary-light" />
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Moneda
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Selecciona la moneda para mostrar los precios
                </p>
                <div className="space-y-2">
                  {currencies.map((curr) => (
                    <button
                      key={curr.id}
                      onClick={() => handleCurrencyChange(curr.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left transform hover:scale-[1.02] ${
                        currency === curr.id
                          ? "border-primary-light bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700"
                          : "border-gray-300 dark:border-gray-600 hover:border-primary-light"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {curr.symbol} {curr.id}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {curr.name}
                          </span>
                        </div>
                        {currency === curr.id && (
                          <CheckIcon className="w-5 h-5 text-primary-light" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Fade>

            {/* Animaciones */}
            <Fade bottom delay={800}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <SparklesIcon className="w-6 h-6 text-primary-light" />
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Animaciones
                  </h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Activa o desactiva las animaciones de la interfaz para mejorar el rendimiento
                </p>
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300 block">
                      {animationsEnabled ? "Animaciones activadas" : "Animaciones desactivadas"}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {animationsEnabled ? "Interfaz más dinámica" : "Mejor rendimiento"}
                    </span>
                  </div>
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
            </Fade>

            {/* Información adicional */}
            <Fade bottom delay={900}>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-indigo-200 dark:border-gray-600">
                <div className="flex items-start gap-3">
                  <InformationCircleIcon className="w-6 h-6 text-primary-light flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      Sobre las Configuraciones
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      Todas las configuraciones se guardan localmente y funcionan tanto en línea como sin conexión. 
                      Tus preferencias se mantendrán incluso después de cerrar la aplicación. 
                      Puedes cambiar estas opciones en cualquier momento.
                    </p>
                  </div>
                </div>
              </div>
            </Fade>
          </div>
        </div>
      </div>
    </>
  );
}

Settings.auth = true;

export default Settings;
