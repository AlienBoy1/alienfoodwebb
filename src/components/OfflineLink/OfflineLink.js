import { useEffect } from 'react';
import Router from 'next/router';

/**
 * Componente que intercepta clics en enlaces cuando está offline
 * y fuerza navegación completa (sin router de Next.js) para que el service worker maneje la petición
 */
function OfflineLinkHandler() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleClick = (e) => {
      // Solo actuar si estamos offline
      if (navigator.onLine) return;

      // Buscar si el click fue en un enlace o dentro de uno
      let target = e.target;
      while (target && target !== document) {
        // Manejar enlaces <a> y también componentes Link de Next.js
        if (target.tagName === 'A' && target.href) {
          const url = target.href;
          const currentOrigin = window.location.origin;
          
          // Solo manejar enlaces internos
          if (url.startsWith(currentOrigin) || url.startsWith('/')) {
            // Prevenir el comportamiento default
            e.preventDefault();
            e.stopPropagation();

            console.log('📴 Offline: Navegando con recarga completa:', url);
            
            // Intentar usar Router.push primero, si falla usar window.location
            try {
              const path = url.replace(currentOrigin, '') || '/';
              Router.push(path).catch(() => {
                // Si Router falla, usar window.location
                window.location.href = url;
              });
            } catch (error) {
              // Si hay error, usar window.location directamente
              window.location.href = url;
            }
          }
          break;
        }
        target = target.parentElement;
      }
    };

    // También interceptar Router.push cuando está offline
    const originalPush = Router.push;
    Router.push = function(...args) {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        const url = typeof args[0] === 'string' ? args[0] : args[0].pathname || '/';
        console.log('📴 Offline: Router.push interceptado, usando window.location:', url);
        window.location.href = url;
        return Promise.resolve();
      }
      return originalPush.apply(this, args);
    };

    // Capturar clicks en fase de captura (antes que Next.js)
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
      Router.push = originalPush;
    };
  }, []);

  return null; // Este componente no renderiza nada
}

export default OfflineLinkHandler;

