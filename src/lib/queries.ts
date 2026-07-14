/**
 * React Query hooks that wrap `src/lib/api.ts`.
 * Components import from here, not directly from api.ts.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  products as productsApi,
  orders as ordersApi,
  admin as adminApi,
  reviews as reviewsApi,
  ApiProduct,
  ApiReview,
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

// ----- Reviews ------------------------------------------------------------

/**
 * List customer reviews for one product. Newest first.
 *
 * The backend is the source of truth — if it's unreachable we resolve
 * with an empty list so the page still renders the demo reviews
 * (the Reviews tab is the only consumer and it always shows the
 * local demo set).
 */
export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "product", productId],
    queryFn: async (): Promise<ApiReview[]> => {
      if (!productId) return [];
      if (!backendEnabled()) return [];
      try {
        const { reviews } = await reviewsApi.list(productId);
        return reviews;
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn(
            "[useProductReviews] backend call failed, returning empty list:",
            err
          );
        }
        return [];
      }
    },
    enabled: Boolean(productId),
    retry: 1,
    staleTime: 30_000,
  });
}

/** Create a review for the current user. */
export function useCreateReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { rating: number; text: string }) => {
      const token = await getAuthToken();
      if (!token) throw new Error("Please sign in to write a review");
      return reviewsApi.create({ productId, ...input }, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", "product", productId] });
    },
  });
}

/** Delete a review. The server enforces that the caller is the author. */
export function useDeleteReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const token = await getAuthToken();
      if (!token) throw new Error("Please sign in");
      return reviewsApi.remove(reviewId, token);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", "product", productId] });
    },
  });
}
