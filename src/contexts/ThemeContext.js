import { createContext, useContext, useEffect, useState } from "react";
import indexedDBService from "../util/IndexedDBService";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [colorScheme, setColorScheme] = useState("default");
  const [fontSize, setFontSize] = useState("medium");
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  // Cargar configuraciones desde IndexedDB al iniciar
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await indexedDBService.getAllSettings();
        
        if (settings.theme) setTheme(settings.theme);
        if (settings.colorScheme) setColorScheme(settings.colorScheme);
        if (settings.fontSize) setFontSize(settings.fontSize);
        if (settings.animationsEnabled !== undefined) {
          setAnimationsEnabled(settings.animationsEnabled);
        }
      } catch (error) {
        console.error("Error cargando configuraciones:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Aplicar tema al documento
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      
      // Aplicar tema claro/oscuro
      if (theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      // Aplicar esquema de colores
      const colorSchemes = {
        default: {
          primary: "#ab3c2a",
          primaryDark: "#792a1e",
        },
        blue: {
          primary: "#3b82f6",
          primaryDark: "#1e40af",
        },
        green: {
          primary: "#10b981",
          primaryDark: "#047857",
        },
        purple: {
          primary: "#8b5cf6",
          primaryDark: "#6d28d9",
        },
        orange: {
          primary: "#f97316",
          primaryDark: "#c2410c",
        },
      };

      const colors = colorSchemes[colorScheme] || colorSchemes.default;
      root.style.setProperty("--color-primary", colors.primary);
      root.style.setProperty("--color-primary-dark", colors.primaryDark);
    }
  }, [theme, colorScheme]);

  // Aplicar tamaño de fuente
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const fontSizes = {
        small: "14px",
        medium: "16px",
        large: "18px",
        xlarge: "20px",
      };
      root.style.setProperty("--font-size-base", fontSizes[fontSize] || fontSizes.medium);
    }
  }, [fontSize]);

  // Aplicar animaciones
  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (!animationsEnabled) {
        root.style.setProperty("--animation-duration", "0s");
        root.classList.add("no-animations");
      } else {
        root.style.removeProperty("--animation-duration");
        root.classList.remove("no-animations");
      }
    }
  }, [animationsEnabled]);

  const updateTheme = async (newTheme) => {
    setTheme(newTheme);
    try {
      await indexedDBService.saveSetting("theme", newTheme);
    } catch (error) {
      console.error("Error guardando tema:", error);
    }
  };

  const updateColorScheme = async (newScheme) => {
    // Aplicar inmediatamente antes de guardar
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const colorSchemes = {
        default: { primary: "#ab3c2a", primaryDark: "#792a1e" },
        blue: { primary: "#3b82f6", primaryDark: "#1e40af" },
        green: { primary: "#10b981", primaryDark: "#047857" },
        purple: { primary: "#8b5cf6", primaryDark: "#6d28d9" },
        orange: { primary: "#f97316", primaryDark: "#c2410c" },
      };
      const colors = colorSchemes[newScheme] || colorSchemes.default;
      root.style.setProperty("--color-primary", colors.primary);
      root.style.setProperty("--color-primary-dark", colors.primaryDark);
    }
    
    setColorScheme(newScheme);
    try {
      await indexedDBService.saveSetting("colorScheme", newScheme);
    } catch (error) {
      console.error("Error guardando esquema de colores:", error);
    }
  };

  const updateFontSize = async (newSize) => {
    setFontSize(newSize);
    try {
      await indexedDBService.saveSetting("fontSize", newSize);
    } catch (error) {
      console.error("Error guardando tamaño de fuente:", error);
    }
  };

  const updateAnimations = async (enabled) => {
    setAnimationsEnabled(enabled);
    try {
      await indexedDBService.saveSetting("animationsEnabled", enabled);
    } catch (error) {
      console.error("Error guardando configuración de animaciones:", error);
    }
  };

  const value = {
    theme,
    colorScheme,
    fontSize,
    animationsEnabled,
    loading,
    updateTheme,
    updateColorScheme,
    updateFontSize,
    updateAnimations,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }
  return context;
}

