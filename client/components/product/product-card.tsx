"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/store";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  return (
    <div className="group relative">
      <Link href={`/products/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          {product.originalPrice && (
            <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-2 py-1 tracking-wide">
              SALE
            </span>
          )}
        </div>
        <div className="mt-4 space-y-1">
          <p className="text-xs text-muted-foreground tracking-wide uppercase">
            {product.category}
          </p>
          <h3 className="text-sm font-medium group-hover:underline">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">${product.price}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.originalPrice}
              </span>
            )}
          </div>
        </div>
      </Link>
      <Button
        size="sm"
        variant="secondary"
        className="absolute bottom-20 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.preventDefault();
          addItem(product);
        }}
      >
        <ShoppingBag className="h-4 w-4 mr-2" />
        Add
      </Button>
    </div>
  );
}
