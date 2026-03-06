export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  category: string;
  image: string;
  images?: string[];
  sizes?: string[];
  colors?: string[];
  inStock: boolean;
  featured?: boolean;
  rating?: number;
  reviews?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Minimalist Wool Coat",
    price: 385,
    originalPrice: 450,
    description: "Crafted from premium Italian wool, this minimalist coat features clean lines and a relaxed silhouette. Perfect for layering during transitional seasons.",
    category: "Outerwear",
    image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=800&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&h=800&fit=crop",
      "https://images.unsplash.com/photo-1548624149-f9461c4c9c98?w=600&h=800&fit=crop",
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Black", "Camel", "Grey"],
    inStock: true,
    featured: true,
    rating: 4.8,
    reviews: 124,
  },
  {
    id: "2",
    name: "Structured Linen Blazer",
    price: 265,
    description: "A modern take on the classic blazer, crafted from breathable linen with a structured shoulder and slim fit.",
    category: "Blazers",
    image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Navy", "Beige", "Black"],
    inStock: true,
    featured: true,
    rating: 4.6,
    reviews: 89,
  },
  {
    id: "3",
    name: "Cashmere Crewneck",
    price: 195,
    description: "Luxuriously soft cashmere crewneck sweater with a relaxed fit. A wardrobe essential for effortless elegance.",
    category: "Knitwear",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=800&fit=crop",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Cream", "Grey", "Black", "Navy"],
    inStock: true,
    featured: true,
    rating: 4.9,
    reviews: 201,
  },
  {
    id: "4",
    name: "Tailored Wool Trousers",
    price: 175,
    description: "Impeccably tailored wool trousers with a high waist and straight leg. Versatile enough for office or evening wear.",
    category: "Bottoms",
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&h=800&fit=crop",
    sizes: ["26", "28", "30", "32", "34"],
    colors: ["Black", "Charcoal", "Navy"],
    inStock: true,
    rating: 4.7,
    reviews: 156,
  },
  {
    id: "5",
    name: "Silk Button-Up Shirt",
    price: 225,
    description: "Elegant silk shirt with mother-of-pearl buttons and a relaxed oversized fit. Timeless sophistication.",
    category: "Shirts",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=800&fit=crop",
    sizes: ["XS", "S", "M", "L"],
    colors: ["White", "Ivory", "Black"],
    inStock: true,
    rating: 4.5,
    reviews: 78,
  },
  {
    id: "6",
    name: "Leather Crossbody Bag",
    price: 320,
    description: "Handcrafted from full-grain Italian leather, this crossbody bag combines functionality with understated luxury.",
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=800&fit=crop",
    colors: ["Black", "Tan", "Burgundy"],
    inStock: true,
    featured: true,
    rating: 4.8,
    reviews: 92,
  },
  {
    id: "7",
    name: "Wide-Leg Denim",
    price: 145,
    description: "Premium Japanese selvedge denim with a high rise and wide leg. Designed for comfort and style.",
    category: "Bottoms",
    image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&h=800&fit=crop",
    sizes: ["24", "26", "28", "30", "32"],
    colors: ["Indigo", "Black", "Light Wash"],
    inStock: true,
    rating: 4.6,
    reviews: 134,
  },
  {
    id: "8",
    name: "Merino Turtleneck",
    price: 165,
    description: "Fine merino wool turtleneck with a slim fit. Lightweight yet warm, perfect for layering.",
    category: "Knitwear",
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=800&fit=crop",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Black", "Grey", "Camel"],
    inStock: true,
    rating: 4.7,
    reviews: 98,
  },
];

export const categories = [
  { name: "All", slug: "all" },
  { name: "Outerwear", slug: "outerwear" },
  { name: "Blazers", slug: "blazers" },
  { name: "Knitwear", slug: "knitwear" },
  { name: "Bottoms", slug: "bottoms" },
  { name: "Shirts", slug: "shirts" },
  { name: "Accessories", slug: "accessories" },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  if (category === "all") return products;
  return products.filter(
    (p) => p.category.toLowerCase() === category.toLowerCase()
  );
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}
