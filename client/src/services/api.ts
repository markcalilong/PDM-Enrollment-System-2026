import type { ApiResponse } from "@shared/types";

// In dev, VITE_API_URL is unset → "/api" is proxied by Vite to the backend.
// In production (two-service deploy), set VITE_API_URL to the backend's URL,
// e.g. "https://pdm-enrollment-api.onrender.com".
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const BASE_URL = `${API_ORIGIN}/api`;

async function request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  const data: ApiResponse<T> = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(body) }),

  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(body) }),

  patch: <T>(endpoint: string, body: unknown = {}) =>
    request<T>(endpoint, { method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
};
