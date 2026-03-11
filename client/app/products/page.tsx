"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard, Product } from "@/components/product/product-card";
import { getProducts, getCategories, transformProduct } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, Grid3X3, LayoutGrid } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";

  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [sortBy, setSortBy] = useState("featured");
  const [gridCols, setGridCols] = useState<3 | 4>(4);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories and products on mount and when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch categories
        const categoriesResult = await getCategories();
        if (categoriesResult.success && categoriesResult.data) {
          setCategories(categoriesResult.data as Category[]);
        }

        // Map sort values to backend sort parameters
        let backendSort = "";
        switch (sortBy) {
          case "price-low":
            backendSort = "price_asc";
            break;
          case "price-high":
            backendSort = "price_desc";
            break;
          case "newest":
            backendSort = "newest";
            break;
          default:
            backendSort = "";
        }

        // Fetch products
        const productsResult = await getProducts({
          category: selectedCategory !== "all" ? selectedCategory : undefined,
          sort: backendSort,
          limit: 50,
        });

        if (productsResult.success && productsResult.data) {
          const transformedProducts = productsResult.data.data.map(transformProduct);
          setProducts(transformedProducts);
        } else {
          setError(productsResult.message || "Failed to fetch products");
        }
      } catch (err) {
        setError("An error occurred while fetching data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, sortBy]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by category (if API doesn't support it)
    if (selectedCategory !== "all") {
      result = result.filter(
        (p) => p.categorySlug === selectedCategory || p.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Sort (if API doesn't support it)
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      default:
        // featured - no sorting needed
        break;
    }

    return result;
  }, [products, selectedCategory, sortBy]);

  const categoryName = selectedCategory === "all"
    ? "All Products"
    : categories.find((c) => c.slug === selectedCategory)?.name || "Products";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Page Header */}
        <div className="border-b border-border bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <span className="text-xs tracking-[0.3em] text-muted-foreground">
              COLLECTION
            </span>
            <h1 className="mt-2 text-3xl sm:text-4xl font-light tracking-wide">
              {categoryName}
            </h1>
            <p className="mt-4 text-muted-foreground max-w-2xl">
              Discover our carefully curated collection of contemporary fashion
              essentials, designed for the modern wardrobe.
            </p>
          </div>
        </div>

        {/* Filters and Products */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-8 border-b border-border">
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="tracking-wide text-xs"
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category._id}
                  variant={selectedCategory === category.slug ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.slug)}
                  className="tracking-wide text-xs"
                >
                  {category.name}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] h-9 text-xs">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="hidden sm:flex items-center gap-1 border-l border-border pl-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className={gridCols === 3 ? "bg-secondary" : ""}
                  onClick={() => setGridCols(3)}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={gridCols === 4 ? "bg-secondary" : ""}
                  onClick={() => setGridCols(4)}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="py-6">
            <p className="text-sm text-muted-foreground">
              {loading ? "Loading..." : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-20 text-center">
              <div className="animate-pulse">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="space-y-4">
                      <div className="aspect-[3/4] bg-secondary rounded-lg animate-pulse"></div>
                      <div className="h-4 bg-secondary rounded w-1/3 animate-pulse"></div>
                      <div className="h-4 bg-secondary rounded w-2/3 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="py-20 text-center">
              <p className="text-red-500">{error}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Product Grid */}
          {!loading && !error && filteredProducts.length > 0 ? (
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 ${
                gridCols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
              }`}
            >
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            !loading && !error && (
              <div className="py-20 text-center">
                <p className="text-muted-foreground">
                  No products found in this category.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSelectedCategory("all")}
                >
                  View All Products
                </Button>
              </div>
            )
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

