// Single source of truth for the API base URL.
// Dev: VITE_API_URL is unset → "/api" (proxied by Vite to the backend).
// Prod (two-service deploy): VITE_API_URL = backend origin, e.g.
//   "https://pdm-enrollment-api.onrender.com" → "https://…/api".
export const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
export const API_BASE = `${API_ORIGIN}/api`;
