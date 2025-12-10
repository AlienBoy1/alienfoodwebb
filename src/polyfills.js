// Polyfills para compatibilidad con iOS/Safari
// Este archivo se carga antes que cualquier otro código
// IMPORTANTE: Este código debe ejecutarse de forma síncrona

(function() {
  'use strict';
  
  if (typeof window === "undefined") {
    return;
  }
  // Definir global para Safari
  if (typeof global === "undefined") {
    window.global = window;
  }

  // Polyfill para requestIdleCallback (no disponible en Safari antiguo)
  if (!window.requestIdleCallback) {
    window.requestIdleCallback = function(callback, options) {
      const start = Date.now();
      return setTimeout(function() {
        callback({
          didTimeout: false,
          timeRemaining: function() {
            return Math.max(0, 50 - (Date.now() - start));
          }
        });
      }, 1);
    };
  }

  if (!window.cancelIdleCallback) {
    window.cancelIdleCallback = function(id) {
      clearTimeout(id);
    };
  }

  // Asegurar que Object.assign esté disponible
  if (typeof Object.assign !== "function") {
    Object.assign = function(target) {
      if (target == null) {
        throw new TypeError("Cannot convert undefined or null to object");
      }
      const to = Object(target);
      for (let index = 1; index < arguments.length; index++) {
        const nextSource = arguments[index];
        if (nextSource != null) {
          for (const nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }

  // Asegurar que Array.from esté disponible
  if (!Array.from) {
    Array.from = function(arrayLike, mapFn, thisArg) {
      const C = this;
      const items = Object(arrayLike);
      if (arrayLike == null) {
        throw new TypeError("Array.from requires an array-like object - not null or undefined");
      }
      const mapFunction = typeof mapFn === "function" ? mapFn : false;
      let T;
      if (typeof mapFn === "function") {
        if (arguments.length > 2) {
          T = thisArg;
        }
      }
      const len = parseInt(items.length) || 0;
      const A = typeof C === "function" ? Object(new C(len)) : new Array(len);
      let k = 0;
      let kValue;
      while (k < len) {
        kValue = items[k];
        if (mapFunction) {
          A[k] = typeof T === "undefined" ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
        } else {
          A[k] = kValue;
        }
        k += 1;
      }
      A.length = len;
      return A;
    };
  }

  // Polyfill crítico para Array.map - asegurar que funcione correctamente en Safari
  if (!Array.prototype.map) {
    Array.prototype.map = function(callback, thisArg) {
      if (this == null) {
        throw new TypeError("Array.prototype.map called on null or undefined");
      }
      if (typeof callback !== "function") {
        throw new TypeError(callback + " is not a function");
      }
      const O = Object(this);
      const len = parseInt(O.length) || 0;
      const A = new Array(len);
      let k = 0;
      while (k < len) {
        if (k in O) {
          const kValue = O[k];
          const mappedValue = thisArg ? callback.call(thisArg, kValue, k, O) : callback(kValue, k, O);
          A[k] = mappedValue;
        }
        k++;
      }
      return A;
    };
  }

  // Asegurar que PerformanceObserver.supportedEntryTypes esté disponible (usado por web-vitals)
  // Esto es crítico para Safari que puede tener PerformanceObserver pero no supportedEntryTypes
  if (typeof PerformanceObserver !== "undefined") {
    if (typeof PerformanceObserver.supportedEntryTypes === "undefined") {
      try {
        // Intentar detectar tipos soportados de forma segura
        if (typeof performance !== "undefined" && performance.getEntriesByType) {
          const testTypes = ['navigation', 'resource', 'paint', 'measure', 'mark', 'layout-shift', 'first-input', 'largest-contentful-paint'];
          PerformanceObserver.supportedEntryTypes = testTypes.filter(function(type) {
            try {
              performance.getEntriesByType(type);
              return true;
            } catch (e) {
              return false;
            }
          });
        } else {
          PerformanceObserver.supportedEntryTypes = [];
        }
      } catch (e) {
        // Si falla, usar array vacío para evitar errores
        PerformanceObserver.supportedEntryTypes = [];
      }
    }
  }

  // Asegurar que String.prototype.includes esté disponible
  if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
      if (typeof start !== "number") {
        start = 0;
      }
      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }

  // Asegurar que Array.prototype.includes esté disponible
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(searchElement, fromIndex) {
      if (this == null) {
        throw new TypeError("Array.prototype.includes called on null or undefined");
      }
      const O = Object(this);
      const len = parseInt(O.length) || 0;
      if (len === 0) {
        return false;
      }
      const n = parseInt(fromIndex) || 0;
      let k = n >= 0 ? n : Math.max(len + n, 0);
      function sameValueZero(x, y) {
        return x === y || (typeof x === "number" && typeof y === "number" && isNaN(x) && isNaN(y));
      }
      while (k < len) {
        if (sameValueZero(O[k], searchElement)) {
          return true;
        }
        k++;
      }
      return false;
    };
  }
})();
