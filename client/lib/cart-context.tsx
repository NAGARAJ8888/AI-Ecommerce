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
import {
  getCart as fetchCartFromApi,
  addToCart as addToCartApi,
  updateCartItem as updateCartItemApi,
  removeFromCart as removeFromCartApi,
  clearCart as clearCartApi,
  transformCart,
} from "@/lib/api";

interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, size?: string, color?: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  loading: boolean;
  error: string | null;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart from backend on mount
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetchCartFromApi();
      
      if (response.success && response.data) {
        const transformedCart = transformCart(response.data);
        
        // Convert backend cart items to frontend format
        const cartItems: CartItem[] = transformedCart.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          // Backend doesn't have size/color, so we use defaults
          size: undefined,
          color: undefined,
        }));
        
        setItems(cartItems);
      } else if (response.message && response.message.includes("logged in")) {
        // User not logged in, use empty cart (local state)
        setItems([]);
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError("Failed to load cart");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch cart on mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = useCallback(
    async (product: Product, quantity = 1, size?: string, color?: string) => {
      try {
        // Call backend API
        const response = await addToCartApi(product.id, quantity);
        
        if (response.success && response.data) {
          // Refresh cart from backend
          const transformedCart = transformCart(response.data);
          const cartItems: CartItem[] = transformedCart.items.map((item) => ({
            product: item.product,
            quantity: item.quantity,
            size: undefined,
            color: undefined,
          }));
          setItems(cartItems);
        } else {
          // If API fails (e.g., not logged in), fall back to local state
          setItems((prev) => {
            const existingIndex = prev.findIndex(
              (item) =>
                item.product.id === product.id &&
                item.size === size &&
                item.color === color
            );

            if (existingIndex > -1) {
              const updated = [...prev];
              updated[existingIndex].quantity += quantity;
              return updated;
            }

            return [...prev, { product, quantity, size, color }];
          });
        }
      } catch (err) {
        console.error("Error adding to cart:", err);
        // Fall back to local state
        setItems((prev) => {
          const existingIndex = prev.findIndex(
            (item) =>
              item.product.id === product.id &&
              item.size === size &&
              item.color === color
          );

          if (existingIndex > -1) {
            const updated = [...prev];
            updated[existingIndex].quantity += quantity;
            return updated;
          }

          return [...prev, { product, quantity, size, color }];
        });
      }
    },
    []
  );

  const removeItem = useCallback(async (productId: string) => {
    try {
      // Call backend API
      const response = await removeFromCartApi(productId);
      
      if (response.success && response.data) {
        // Refresh cart from backend
        const transformedCart = transformCart(response.data);
        const cartItems: CartItem[] = transformedCart.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          size: undefined,
          color: undefined,
        }));
        setItems(cartItems);
      } else {
        // Fall back to local state
        setItems((prev) => prev.filter((item) => item.product.id !== productId));
      }
    } catch (err) {
      console.error("Error removing from cart:", err);
      // Fall back to local state
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
    }
  }, []);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (quantity < 1) return;
    
    try {
      // Call backend API
      const response = await updateCartItemApi(productId, quantity);
      
      if (response.success && response.data) {
        // Refresh cart from backend
        const transformedCart = transformCart(response.data);
        const cartItems: CartItem[] = transformedCart.items.map((item) => ({
          product: item.product,
          quantity: item.quantity,
          size: undefined,
          color: undefined,
        }));
        setItems(cartItems);
      } else {
        // Fall back to local state
        setItems((prev) =>
          prev.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          )
        );
      }
    } catch (err) {
      console.error("Error updating cart:", err);
      // Fall back to local state
      setItems((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      // Call backend API
      const response = await clearCartApi();
      
      if (response.success) {
        setItems([]);
      } else {
        // Fall back to local state
        setItems([]);
      }
    } catch (err) {
      console.error("Error clearing cart:", err);
      // Fall back to local state
      setItems([]);
    }
  }, []);

  const refreshCart = useCallback(async () => {
    await fetchCart();
  }, [fetchCart]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        loading,
        error,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

