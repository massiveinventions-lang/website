/**
 * React Query hooks that wrap `src/lib/api.ts`.
 * Components import from here, not directly from api.ts.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  products as productsApi,
  orders as ordersApi,
  admin as adminApi,
  ApiProduct,
} from "./api";
import { getAuthToken } from "./supabase";

// ----- Products -----------------------------------------------------------

export function useProducts(params: { category?: string; q?: string } = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.list(params),
    staleTime: 30_000,
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.get(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

// ----- Orders -------------------------------------------------------------

export function useMyOrders(enabled = true) {
  return useQuery({
    queryKey: ["orders", "mine"],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");
      return ordersApi.mine(token);
    },
    enabled,
  });
}

export function useOrder(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");
      return ordersApi.get(id as string, token);
    },
    enabled: Boolean(id) && enabled,
  });
}

export function useCreateOrder() {
  return useMutation({
    mutationFn: async (input: Parameters<typeof ordersApi.create>[0]) => {
      const token = await getAuthToken();
      if (!token) throw new Error("Please sign in to place an order");
      return ordersApi.create(input, token);
    },
  });
}

export function useVerifyOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Parameters<typeof ordersApi.verify>[0]
    ) => {
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");
      return ordersApi.verify(input, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

// ----- Admin --------------------------------------------------------------

export function useAdminStats(enabled = true) {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) throw new Error("Not authenticated");
      return adminApi.stats(token);
    },
    enabled,
  });
}

// ----- Local helpers ------------------------------------------------------

/** Convert API product (id: string) to the data-file Product shape (id: number). */
export function apiProductToLocal(
  p: ApiProduct
): import("@/data/products").Product {
  return {
    ...p,
    id: Number(p.id.replace(/-/g, "").slice(0, 13)) || Math.abs(
      [...p.id].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)
    ),
  } as unknown as import("@/data/products").Product;
}
