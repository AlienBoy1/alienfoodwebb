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
      
      // Aplicar tema claro/oscuro con mejor contraste
      if (theme === "dark") {
        root.classList.add("dark");
        // Mejorar modo oscuro con colores más suaves y mejor contraste
        root.style.setProperty("--bg-primary", "#111827");
        root.style.setProperty("--bg-secondary", "#1f2937");
        root.style.setProperty("--bg-tertiary", "#374151");
        root.style.setProperty("--text-primary", "#f9fafb");
        root.style.setProperty("--text-secondary", "#e5e7eb");
        root.style.setProperty("--text-muted", "#9ca3af");
        root.style.setProperty("--border-color", "#374151");
      } else {
        root.classList.remove("dark");
        // Colores para modo claro
        root.style.setProperty("--bg-primary", "#ffffff");
        root.style.setProperty("--bg-secondary", "#f9fafb");
        root.style.setProperty("--bg-tertiary", "#f3f4f6");
        root.style.setProperty("--text-primary", "#111827");
        root.style.setProperty("--text-secondary", "#374151");
        root.style.setProperty("--text-muted", "#6b7280");
        root.style.setProperty("--border-color", "#e5e7eb");
      }

      // Aplicar esquema de colores con más opciones
      const colorSchemes = {
        default: {
          primary: "#6366f1",
          primaryDark: "#4f46e5",
          primaryLight: "#818cf8",
          secondary: "#8b5cf6",
          accent: "#ec4899",
        },
        blue: {
          primary: "#3b82f6",
          primaryDark: "#1e40af",
          primaryLight: "#60a5fa",
          secondary: "#2563eb",
          accent: "#0ea5e9",
        },
        green: {
          primary: "#10b981",
          primaryDark: "#047857",
          primaryLight: "#34d399",
          secondary: "#059669",
          accent: "#06b6d4",
        },
        purple: {
          primary: "#8b5cf6",
          primaryDark: "#6d28d9",
          primaryLight: "#a78bfa",
          secondary: "#7c3aed",
          accent: "#a855f7",
        },
        orange: {
          primary: "#f97316",
          primaryDark: "#c2410c",
          primaryLight: "#fb923c",
          secondary: "#ea580c",
          accent: "#f59e0b",
        },
        pink: {
          primary: "#ec4899",
          primaryDark: "#be185d",
          primaryLight: "#f472b6",
          secondary: "#db2777",
          accent: "#f43f5e",
        },
        red: {
          primary: "#ef4444",
          primaryDark: "#dc2626",
          primaryLight: "#f87171",
          secondary: "#b91c1c",
          accent: "#f43f5e",
        },
        teal: {
          primary: "#14b8a6",
          primaryDark: "#0d9488",
          primaryLight: "#5eead4",
          secondary: "#0f766e",
          accent: "#06b6d4",
        },
        cyan: {
          primary: "#06b6d4",
          primaryDark: "#0891b2",
          primaryLight: "#22d3ee",
          secondary: "#0e7490",
          accent: "#0ea5e9",
        },
        amber: {
          primary: "#f59e0b",
          primaryDark: "#d97706",
          primaryLight: "#fbbf24",
          secondary: "#b45309",
          accent: "#f97316",
        },
        emerald: {
          primary: "#10b981",
          primaryDark: "#059669",
          primaryLight: "#34d399",
          secondary: "#047857",
          accent: "#14b8a6",
        },
        indigo: {
          primary: "#6366f1",
          primaryDark: "#4f46e5",
          primaryLight: "#818cf8",
          secondary: "#4338ca",
          accent: "#8b5cf6",
        },
        violet: {
          primary: "#8b5cf6",
          primaryDark: "#7c3aed",
          primaryLight: "#a78bfa",
          secondary: "#6d28d9",
          accent: "#a855f7",
        },
        rose: {
          primary: "#f43f5e",
          primaryDark: "#e11d48",
          primaryLight: "#fb7185",
          secondary: "#be123c",
          accent: "#ec4899",
        },
        sky: {
          primary: "#0ea5e9",
          primaryDark: "#0284c7",
          primaryLight: "#38bdf8",
          secondary: "#0369a1",
          accent: "#06b6d4",
        },
      };

      const colors = colorSchemes[colorScheme] || colorSchemes.default;
      root.style.setProperty("--color-primary", colors.primary);
      root.style.setProperty("--color-primary-dark", colors.primaryDark);
      root.style.setProperty("--color-primary-light", colors.primaryLight);
      root.style.setProperty("--color-secondary", colors.secondary);
      root.style.setProperty("--color-accent", colors.accent);
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
        default: { primary: "#6366f1", primaryDark: "#4f46e5", primaryLight: "#818cf8", secondary: "#8b5cf6", accent: "#ec4899" },
        blue: { primary: "#3b82f6", primaryDark: "#1e40af", primaryLight: "#60a5fa", secondary: "#2563eb", accent: "#0ea5e9" },
        green: { primary: "#10b981", primaryDark: "#047857", primaryLight: "#34d399", secondary: "#059669", accent: "#06b6d4" },
        purple: { primary: "#8b5cf6", primaryDark: "#6d28d9", primaryLight: "#a78bfa", secondary: "#7c3aed", accent: "#a855f7" },
        orange: { primary: "#f97316", primaryDark: "#c2410c", primaryLight: "#fb923c", secondary: "#ea580c", accent: "#f59e0b" },
        pink: { primary: "#ec4899", primaryDark: "#be185d", primaryLight: "#f472b6", secondary: "#db2777", accent: "#f43f5e" },
        red: { primary: "#ef4444", primaryDark: "#dc2626", primaryLight: "#f87171", secondary: "#b91c1c", accent: "#f43f5e" },
        teal: { primary: "#14b8a6", primaryDark: "#0d9488", primaryLight: "#5eead4", secondary: "#0f766e", accent: "#06b6d4" },
        cyan: { primary: "#06b6d4", primaryDark: "#0891b2", primaryLight: "#22d3ee", secondary: "#0e7490", accent: "#0ea5e9" },
        amber: { primary: "#f59e0b", primaryDark: "#d97706", primaryLight: "#fbbf24", secondary: "#b45309", accent: "#f97316" },
        emerald: { primary: "#10b981", primaryDark: "#059669", primaryLight: "#34d399", secondary: "#047857", accent: "#14b8a6" },
        indigo: { primary: "#6366f1", primaryDark: "#4f46e5", primaryLight: "#818cf8", secondary: "#4338ca", accent: "#8b5cf6" },
        violet: { primary: "#8b5cf6", primaryDark: "#7c3aed", primaryLight: "#a78bfa", secondary: "#6d28d9", accent: "#a855f7" },
        rose: { primary: "#f43f5e", primaryDark: "#e11d48", primaryLight: "#fb7185", secondary: "#be123c", accent: "#ec4899" },
        sky: { primary: "#0ea5e9", primaryDark: "#0284c7", primaryLight: "#38bdf8", secondary: "#0369a1", accent: "#06b6d4" },
      };
      const colors = colorSchemes[newScheme] || colorSchemes.default;
      root.style.setProperty("--color-primary", colors.primary);
      root.style.setProperty("--color-primary-dark", colors.primaryDark);
      root.style.setProperty("--color-primary-light", colors.primaryLight);
      root.style.setProperty("--color-secondary", colors.secondary);
      root.style.setProperty("--color-accent", colors.accent);
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
