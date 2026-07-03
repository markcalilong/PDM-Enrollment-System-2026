import { api } from "./api";
import type { LoginRequest, LoginResponse } from "@shared/types";

export const authService = {
  async login(credentials: LoginRequest) {
    const res = await api.post<LoginResponse>("/auth/login", credentials);
    if (res.data) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }
    return res.data!;
  },

  async register(data: LoginRequest & { first_name: string; last_name: string }) {
    const res = await api.post<LoginResponse>("/auth/register", data);
    if (res.data) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }
    return res.data!;
  },

  logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getToken() {
    return localStorage.getItem("token");
  },

  getUser() {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem("token");
  },
};
