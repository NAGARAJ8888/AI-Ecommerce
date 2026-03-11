"use client";

import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { getFeaturedProducts } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  category: string;
  categorySlug?: string;
  image: string;
  images?: string[];
  brand?: string;
  stock?: number;
  inStock?: boolean;
  rating?: number;
  reviews?: number;
  tags?: string[];
  aiScore?: number;
  createdAt?: string;
}

const categories = [
  { name: "All", slug: "all" },
  { name: "Clothing", slug: "all" },
  { name: "Shoes", slug: "shoes" },
  { name: "Accessories", slug: "accessories" },
  { name: "Bags", slug: "bags" },
  { name: "Jewelry", slug: "jewelry" },
  { name: "Watches", slug: "watches" },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedProducts() {
      try {
        const response = await getFeaturedProducts();
        if (response.success && response.data) {
          setFeaturedProducts(response.data);
        }
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedProducts();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[80vh] min-h-[600px] bg-secondary">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&h=1080&fit=crop"
            alt="Hero"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-foreground/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <span className="text-xs tracking-[0.3em] text-background/80 mb-4">
              NEW COLLECTION
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-wide text-background text-balance max-w-4xl">
              Timeless Elegance, Modern Design
            </h1>
            <p className="mt-6 text-background/80 text-sm sm:text-base max-w-xl text-pretty">
              Discover our curated collection of contemporary fashion essentials
              crafted with exceptional quality and attention to detail.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link href="/products">
                <Button size="lg" className="min-w-[200px] tracking-wide">
                  SHOP COLLECTION
                </Button>
              </Link>
              <Link href="/products">
                <Button
                  size="lg"
                  variant="outline"
                  className="min-w-[200px] tracking-wide bg-transparent border-background text-background hover:bg-background hover:text-foreground"
                >
                  EXPLORE
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <span className="text-xs tracking-[0.3em] text-muted-foreground">
                EXPLORE
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-light tracking-wide">
                Shop by Category
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.slice(1).map((category) => (
                <Link
                  key={category.slug}
                  href={`/products?category=${category.slug}`}
                  className="group relative aspect-square bg-secondary overflow-hidden"
                >
                  <div className="absolute inset-0 bg-foreground/5 group-hover:bg-foreground/10 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-medium tracking-wide group-hover:underline">
                      {category.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-secondary/50">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-12 gap-4">
              <div>
                <span className="text-xs tracking-[0.3em] text-muted-foreground">
                  CURATED
                </span>
                <h2 className="mt-2 text-2xl sm:text-3xl font-light tracking-wide">
                  Featured Products
                </h2>
              </div>
              <Link
                href="/products"
                className="group flex items-center gap-2 text-sm font-medium"
              >
                View All
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-secondary rounded-md" />
                    <div className="mt-4 h-4 bg-secondary rounded w-1/4" />
                    <div className="mt-2 h-4 bg-secondary rounded w-3/4" />
                    <div className="mt-2 h-4 bg-secondary rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No featured products available at the moment.</p>
              </div>
            )}
          </div>
        </section>

        {/* Highlight Banner */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="relative aspect-[4/5] bg-secondary overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1000&fit=crop"
                  alt="Featured collection"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col justify-center py-8 lg:py-0 lg:px-12">
                <span className="text-xs tracking-[0.3em] text-muted-foreground">
                  CRAFTSMANSHIP
                </span>
                <h2 className="mt-4 text-3xl sm:text-4xl font-light tracking-wide text-balance">
                  Designed with Purpose, Made to Last
                </h2>
                <p className="mt-6 text-muted-foreground leading-relaxed text-pretty">
                  Every piece in our collection is thoughtfully designed and crafted
                  using premium materials. We believe in creating timeless wardrobe
                  staples that transcend seasonal trends.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-3xl font-light">100%</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Sustainable Materials
                    </p>
                  </div>
                  <div>
                    <p className="text-3xl font-light">5 Year</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Quality Guarantee
                    </p>
                  </div>
                </div>
                <Link href="/products" className="mt-10">
                  <Button variant="outline" className="tracking-wide">
                    EXPLORE COLLECTION
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs tracking-[0.3em] opacity-70">
              STAY UPDATED
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl font-light tracking-wide">
              Join Our Newsletter
            </h2>
            <p className="mt-4 text-sm opacity-70">
              Subscribe to receive updates on new arrivals, exclusive offers, and
              style inspiration.
            </p>
            <form className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 h-11 px-4 bg-transparent border border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:border-primary-foreground"
              />
              <Button
                type="submit"
                variant="secondary"
                className="h-11 px-8 tracking-wide"
              >
                SUBSCRIBE
              </Button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
