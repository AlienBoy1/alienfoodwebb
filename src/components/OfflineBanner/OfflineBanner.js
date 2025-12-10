import { useState, useEffect } from "react";
import { WifiIcon } from "@heroicons/react/outline";
import { XIcon } from "@heroicons/react/solid";

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  useEffect(() => {
    // Verificar estado inicial
    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine);
      
      // Si está offline al cargar y no se ha mostrado antes, mostrar el banner
      if (!navigator.onLine && !hasShownOnce) {
        setShowBanner(true);
        setHasShownOnce(true);
      }
    }

    // Escuchar cambios en el estado de conexión
    const handleOnline = () => {
      setIsOffline(false);
      setShowBanner(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      // Solo mostrar el banner si no se ha mostrado antes en esta sesión
      if (!hasShownOnce) {
        setShowBanner(true);
        setHasShownOnce(true);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [hasShownOnce]);

  if (!showBanner || !isOffline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-3 shadow-lg z-50 flex items-center justify-between">
      <div className="flex items-center space-x-3 flex-1">
        <WifiIcon className="w-5 h-5" />
        <div className="flex-1">
          <p className="font-semibold text-sm">
            Sin conexión a internet
          </p>
          <p className="text-xs opacity-90">
            Puedes seguir navegando. Tus datos se guardarán y se sincronizarán cuando se reestablezca la conexión.
          </p>
        </div>
      </div>
      <button
        onClick={() => setShowBanner(false)}
        className="ml-4 flex-shrink-0 hover:opacity-75 transition-opacity"
        aria-label="Cerrar"
      >
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
}

export default OfflineBanner;

