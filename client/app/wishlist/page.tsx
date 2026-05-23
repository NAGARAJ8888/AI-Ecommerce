"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Trash2, Heart, ChevronLeft } from "lucide-react";
import { toast } from "sonner";

export default function WishlistPage() {
  const { items, removeFromWishlist, loading } = useWishlist();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const handleAddToCart = async (product: any) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent("open-auth-dialog"));
      return;
    }

    try {
      setAddingToCart(product.id);
      await addItem(product);
      toast.success("Added to cart");
    } catch (err) {
      console.error("Error adding to cart:", err);
      toast.error("Failed to add to cart");
    } finally {
      setAddingToCart(null);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      toast.success("Removed from wishlist");
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      toast.error("Failed to remove from wishlist");
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Please log in to view your wishlist</p>
            <Button onClick={() => window.dispatchEvent(new CustomEvent("open-auth-dialog"))}>
              Sign In
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Page Header */}
        <div className="border-b border-border bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start">

              <span className="mt-4 text-xs tracking-[0.3em] text-muted-foreground">
                MY COLLECTION
              </span>
            </div>
            <h1 className="mt-2 text-3xl sm:text-4xl font-light tracking-wide">
              Wishlist
            </h1>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              Your saved products. Add them to cart when you're ready to purchase.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-pulse">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-4">
                      <div className="aspect-[3/4] bg-secondary rounded-lg animate-pulse"></div>
                      <div className="h-4 bg-secondary rounded w-1/3 animate-pulse"></div>
                      <div className="h-4 bg-secondary rounded w-2/3 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center">
              <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground mb-6">
                Your wishlist is empty
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Add products to your wishlist by clicking the heart icon
              </p>
              <Link href="/products">
                <Button>
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {items.length} item{items.length !== 1 ? "s" : ""} in wishlist
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {items.map((product, index) => (
                  <div
                    key={`${product.id}-${index}`}
                    className="group flex flex-col h-full border border-border rounded-lg overflow-hidden hover:border-foreground/50 transition-colors"
                  >
                    {/* Product Image */}
                    <Link
                      href={`/products/${product.id}`}
                      className="relative aspect-[3/4] bg-secondary overflow-hidden flex-shrink-0"
                    >
                      {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            No Image
                          </div>
                        )}
                    </Link>

                    {/* Product Info */}
                    <div className="flex-1 p-4 flex flex-col">
                      <Link
                        href={`/products/${product.id}`}
                        className="text-sm font-medium hover:text-muted-foreground transition-colors flex-1"
                      >
                        {product.name}
                      </Link>

                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-lg font-medium">${product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${product.originalPrice}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        {product.inStock ? (
                          <span className="text-green-600">In Stock</span>
                        ) : (
                          <span className="text-red-600">Out of Stock</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 flex gap-2 pt-4 border-t border-border">
                        <Button
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleAddToCart(product)}
                          disabled={addingToCart === product.id}
                        >
                          <ShoppingBag className="h-3 w-3 mr-1" />
                          Add to Cart
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFromWishlist(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
