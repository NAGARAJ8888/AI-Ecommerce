"use client";

import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  const shipping = totalPrice > 200 ? 0 : 15;
  const total = totalPrice + shipping;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-light tracking-wide mb-8">Shopping Cart</h1>

          {items.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/50" />
              <h2 className="mt-6 text-xl font-light">Your cart is empty</h2>
              <p className="mt-2 text-muted-foreground">
                Discover our collection and add items to your cart.
              </p>
              <Link href="/products">
                <Button className="mt-8 tracking-wide">
                  CONTINUE SHOPPING
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="border-b border-border pb-4 mb-6 hidden sm:grid grid-cols-12 gap-4 text-xs text-muted-foreground tracking-wide">
                  <div className="col-span-6">PRODUCT</div>
                  <div className="col-span-2 text-center">QUANTITY</div>
                  <div className="col-span-2 text-right">PRICE</div>
                  <div className="col-span-2 text-right">TOTAL</div>
                </div>

                <div className="space-y-6">
                  {items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.size}-${item.color}`}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-4 pb-6 border-b border-border"
                    >
                      {/* Product */}
                      <div className="sm:col-span-6 flex gap-4">
                        <div className="relative h-24 w-20 flex-shrink-0 bg-secondary overflow-hidden">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <Link
                            href={`/products/${item.product.id}`}
                            className="font-medium hover:underline"
                          >
                            {item.product.name}
                          </Link>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {item.color && <span>{item.color}</span>}
                            {item.color && item.size && <span> / </span>}
                            {item.size && <span>Size {item.size}</span>}
                          </div>
                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 sm:hidden"
                          >
                            <X className="h-3 w-3" />
                            Remove
                          </button>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="sm:col-span-2 flex items-center justify-start sm:justify-center">
                        <div className="flex items-center border border-border">
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            className="p-2 hover:bg-secondary transition-colors disabled:opacity-50"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(item.product.id, item.quantity + 1)
                            }
                            className="p-2 hover:bg-secondary transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="sm:col-span-2 flex items-center justify-between sm:justify-end">
                        <span className="text-sm text-muted-foreground sm:hidden">
                          Price:
                        </span>
                        <span className="text-sm">${item.product.price}</span>
                      </div>

                      {/* Total */}
                      <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-4">
                        <span className="text-sm text-muted-foreground sm:hidden">
                          Total:
                        </span>
                        <span className="font-medium">
                          ${item.product.price * item.quantity}
                        </span>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="hidden sm:block text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
                  <Link href="/products">
                    <Button variant="outline" className="tracking-wide">
                      CONTINUE SHOPPING
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="text-muted-foreground"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </Button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-secondary/50 p-6 sticky top-24">
                  <h2 className="text-lg font-medium mb-6">Order Summary</h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>
                        {shipping === 0 ? (
                          <span className="text-green-600">Free</span>
                        ) : (
                          `$${shipping.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Free shipping on orders over $200
                      </p>
                    )}
                    <div className="border-t border-border pt-3 mt-3">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <Link href="/checkout" className="block mt-6">
                    <Button className="w-full tracking-wide">
                      CHECKOUT
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>

                  <div className="mt-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      Secure checkout. All major cards accepted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
