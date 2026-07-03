import { useState, useEffect, useCallback } from "react";
import type { ApiResponse } from "@shared/types";

interface CrudService<T> {
  getAll: () => Promise<ApiResponse<T[]>>;
  create: (data: Partial<T>) => Promise<ApiResponse<T>>;
  update: (id: number, data: Partial<T>) => Promise<ApiResponse<T>>;
  remove: (id: number) => Promise<ApiResponse>;
}

export function useCrud<T extends { id: number }>(service: CrudService<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await service.getAll();
      setItems(res.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (data: Partial<T>) => {
    const res = await service.create(data);
    await fetchAll();
    return res.data;
  };

  const update = async (id: number, data: Partial<T>) => {
    const res = await service.update(id, data);
    await fetchAll();
    return res.data;
  };

  const remove = async (id: number) => {
    await service.remove(id);
    await fetchAll();
  };

  return { items, loading, error, fetchAll, create, update, remove };
}
