"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Product } from "@/components/product/product-card";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth } from "@/lib/auth/fetchWithAuth";

interface WishlistContextType {
  items: Product[];
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  totalItems: number;
  loading: boolean;
  error: string | null;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(user);

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetchWithAuth<any>("/users/me", {
        method: "GET",
        credentials: "include",
      });

      if (
        response.success &&
        response.data &&
        Array.isArray(response.data.wishlist)
      ) {
        const wishlistItems = response.data.wishlist.map((item: any) => ({
          id: item._id,
          name: item.name,
          price: item.price,
          originalPrice: item.discountPrice,
          category: item.category?.name || "",
          categorySlug: item.category?.slug || "",
          image: item.images?.[0]?.url || "",
          images: item.images?.map((img: any) => img.url) || [],
          inStock: item.stock > 0,
          rating: item.ratings,
          reviews: item.numReviews,
          createdAt: item.createdAt,
        }));

        setItems(wishlistItems);
      } else {
        setError(response.message || "Failed to load wishlist");
      }
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
      setError("Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchWishlist();
    }
  }, [fetchWishlist, isAuthLoading]);

  const addToWishlist = useCallback(
    async (product: Product) => {
      if (!isAuthenticated) {
        setError("Please log in to add items to your wishlist");

        window.dispatchEvent(
          new CustomEvent("open-auth-dialog")
        );

        return;
      }

      if (items.some((item) => item.id === product.id)) {
        return;
      }

      setError(null);

      // optimistic update
      setItems((prev) => [...prev, product]);

      try {
        const response = await fetchWithAuth<any>(
          `/users/wishlist/${product.id}`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        if (!response.success) {
          // rollback
          setItems((prev) =>
            prev.filter((item) => item.id !== product.id)
          );

          setError(
            response.message || "Failed to add to wishlist"
          );
        }
      } catch (err) {
        console.error("Error adding to wishlist:", err);

        // rollback
        setItems((prev) =>
          prev.filter((item) => item.id !== product.id)
        );

        setError("Failed to add to wishlist");
      }
    },
    [isAuthenticated, items]
  );

  const removeFromWishlist = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) return;

      setError(null);

      const previousItems = items;

      // optimistic update
      setItems((prev) =>
        prev.filter((item) => item.id !== productId)
      );

      try {
        const response = await fetchWithAuth<any>(
          `/users/wishlist/${productId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );

        if (!response.success) {
          // rollback
          setItems(previousItems);

          setError(
            response.message ||
              "Failed to remove from wishlist"
          );
        }
      } catch (err) {
        console.error("Error removing from wishlist:", err);

        // rollback
        setItems(previousItems);

        setError("Failed to remove from wishlist");
      }
    },
    [isAuthenticated, items]
  );

  const isInWishlist = useCallback(
    (productId: string) => {
      return items.some((item) => item.id === productId);
    },
    [items]
  );

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        totalItems: items.length,
        loading,
        error,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
