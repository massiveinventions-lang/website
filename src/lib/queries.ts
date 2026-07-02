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
  backendEnabled,
} from "./api";
import { getAuthToken } from "./supabase";
import { products as localProducts, type Product as LocalProduct } from "@/data/products";

// ----- Products -----------------------------------------------------------

/**
 * Convert a local-fallback Product (id: number, image: string) to the
 * ApiProduct shape the rest of the UI expects (id: string, image: ImageRef).
 */
function localToApiProduct(p: LocalProduct): ApiProduct {
  return {
    id: String(p.id),
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    rating: p.rating,
    reviews: p.reviews,
    category: p.category,
    badge: p.badge,
    image: p.image,
    hoverImage: p.hoverImage,
    images: p.images,
    description: p.description,
    longDescription: p.longDescription,
    inStock: p.inStock,
    stock: 100,
    specs: p.specs,
    features: p.features,
    colors: p.colors,
  };
}

export function useProducts(params: { category?: string; q?: string } = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      // If the backend URL isn't configured at all (build-time
      // VITE_API_URL is empty AND config.js didn't load), short-circuit
      // to local data — there's no point hitting a relative URL.
      if (!backendEnabled()) {
        return { products: filterLocal(params) };
      }
      // Try the backend first. If it fails (5xx, network error,
      // Cloudflare block, etc.) fall back to the local data so the
      // storefront never goes blank. This matches the behavior of the
      // static data file (src/data/products.ts) that the rest of the
      // site was built around.
      try {
        return await productsApi.list(params);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn(
            "[useProducts] backend call failed, using local fallback:",
            err
          );
        }
        return { products: filterLocal(params) };
      }
    },
    retry: 1,
    staleTime: 30_000,
  });
}

function filterLocal(params: { category?: string; q?: string }): ApiProduct[] {
  let list = localProducts.map(localToApiProduct);
  if (params.category) {
    list = list.filter((p) => p.category === params.category);
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q));
  }
  return list;
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      if (!backendEnabled()) {
        const local = localProducts.find((p) => String(p.id) === id);
        if (!local) throw new Error("Product not found");
        return { product: localToApiProduct(local) };
      }
      try {
        return await productsApi.get(id as string);
      } catch (err) {
        const local = localProducts.find((p) => String(p.id) === id);
        if (local) return { product: localToApiProduct(local) };
        throw err;
      }
    },
    enabled: Boolean(id),
    retry: 1,
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
