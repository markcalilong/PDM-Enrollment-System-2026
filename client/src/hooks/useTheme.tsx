import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { InstitutionSettings } from "@shared/types";
import { institutionService } from "../services/maintenanceService";

interface ThemeContext {
  settings: InstitutionSettings | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const ThemeCtx = createContext<ThemeContext>({ settings: null, loading: true, refresh: async () => {} });

/**
 * Convert a hex color to HSL values so Tailwind-style utility classes work
 * via CSS custom properties.
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function applyThemeToDOM(primary: string, secondary: string) {
  const root = document.documentElement;
  const p = hexToHSL(primary);
  const s = hexToHSL(secondary);

  // Generate a full palette from the primary color
  root.style.setProperty("--color-primary-50", `hsl(${p.h}, ${p.s}%, 97%)`);
  root.style.setProperty("--color-primary-100", `hsl(${p.h}, ${p.s}%, 93%)`);
  root.style.setProperty("--color-primary-200", `hsl(${p.h}, ${p.s}%, 85%)`);
  root.style.setProperty("--color-primary-300", `hsl(${p.h}, ${p.s}%, 74%)`);
  root.style.setProperty("--color-primary-400", `hsl(${p.h}, ${p.s}%, 62%)`);
  root.style.setProperty("--color-primary-500", primary);
  root.style.setProperty("--color-primary-600", `hsl(${p.h}, ${Math.min(p.s + 5, 100)}%, ${Math.max(p.l - 8, 10)}%)`);
  root.style.setProperty("--color-primary-700", `hsl(${p.h}, ${Math.min(p.s + 10, 100)}%, ${Math.max(p.l - 16, 10)}%)`);
  root.style.setProperty("--color-primary-800", `hsl(${s.h}, ${s.s}%, ${s.l}%)`);
  root.style.setProperty("--color-primary-900", `hsl(${p.h}, ${Math.min(p.s + 15, 100)}%, ${Math.max(p.l - 28, 5)}%)`);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<InstitutionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await institutionService.get();
      const data = res.data as InstitutionSettings;
      setSettings(data);
      if (data?.primary_color && data?.secondary_color) {
        applyThemeToDOM(data.primary_color, data.secondary_color);
      }
    } catch {
      // Silently fail — use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <ThemeCtx.Provider value={{ settings, loading, refresh }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeCtx);
}
