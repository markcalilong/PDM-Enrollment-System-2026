import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import type { LoginRequest } from "@shared/types";

export function useAuth() {
  const [user, setUser] = useState(authService.getUser());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const login = useCallback(async (credentials: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.login(credentials);
      setUser(result.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const register = useCallback(async (data: LoginRequest & { first_name: string; last_name: string }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.register(data);
      setUser(result.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    navigate("/login");
  }, [navigate]);

  return { user, error, loading, login, register, logout, isAuthenticated: !!user };
}
