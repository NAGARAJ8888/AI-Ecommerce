const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface ProductImage {
  url: string;
  public_id: string;
}

interface CategoryData {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

interface BackendProduct {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  discountPrice?: number;
  category: CategoryData | string;
  brand?: string;
  images: ProductImage[];
  stock: number;
  ratings: number;
  numReviews: number;
  tags?: string[];
  aiScore?: number;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ProductsResponse {
  data: BackendProduct[];
  pagination: Pagination;
}

interface CreateProductData {
  name: string;
  slug: string;
  description?: string;
  price: number;
  discountPrice?: number;
  category?: string;
  brand?: string;
  stock: number;
  tags?: string;
  images: File[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function createProduct(
  productData: CreateProductData
): Promise<ApiResponse<any>> {
  try {
    const formData = new FormData();

    // Append text fields
    formData.append("name", productData.name);
    formData.append("slug", productData.slug);
    if (productData.description) {
      formData.append("description", productData.description);
    }
    formData.append("price", productData.price.toString());
    
    if (productData.discountPrice) {
      formData.append("discountPrice", productData.discountPrice.toString());
    }
    // Only send category if it's a valid MongoDB ObjectId (24 hex chars)
    if (productData.category && productData.category.match(/^[a-fA-F0-9]{24}$/)) {
      formData.append("category", productData.category);
    }
    if (productData.brand) {
      formData.append("brand", productData.brand);
    }
    formData.append("stock", productData.stock.toString());
    if (productData.tags) {
      formData.append("tags", productData.tags);
    }

    // Append images
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((image) => {
        formData.append("images", image);
      });
    }

    // Get token from localStorage
    const token = localStorage.getItem("token");
    
    if (!token) {
      return {
        success: false,
        message: "You must be logged in to create a product",
      };
    }

    const response = await fetch(`${API_URL}/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to create product",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      message: "An error occurred while creating the product",
    };
  }
}

export async function getCategories(): Promise<ApiResponse<any[]>> {
  try {
    const response = await fetch(`${API_URL}/categories`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch categories",
      };
    }

    return {
      success: true,
      data: data.data || data,
    };
  } catch (error) {
    console.error("Error fetching categories:", error);
    return {
      success: false,
      message: "An error occurred while fetching categories",
    };
  }
}

interface UpdateProductData {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  discountPrice?: number;
  category?: string;
  brand?: string;
  stock?: number;
  tags?: string;
  images?: File[];
}

export async function updateProduct(
  productId: string,
  productData: UpdateProductData
): Promise<ApiResponse<any>> {
  try {
    const formData = new FormData();

    // Append text fields
    if (productData.name) {
      formData.append("name", productData.name);
    }
    if (productData.slug) {
      formData.append("slug", productData.slug);
    }
    if (productData.description) {
      formData.append("description", productData.description);
    }
    if (productData.price !== undefined) {
      formData.append("price", productData.price.toString());
    }
    if (productData.discountPrice !== undefined) {
      formData.append("discountPrice", productData.discountPrice.toString());
    }
    if (productData.category && productData.category.match(/^[a-fA-F0-9]{24}$/)) {
      formData.append("category", productData.category);
    }
    if (productData.brand) {
      formData.append("brand", productData.brand);
    }
    if (productData.stock !== undefined) {
      formData.append("stock", productData.stock.toString());
    }
    if (productData.tags) {
      formData.append("tags", productData.tags);
    }

    // Append images
    if (productData.images && productData.images.length > 0) {
      productData.images.forEach((image) => {
        formData.append("images", image);
      });
    }

    // Get token from localStorage
    const token = localStorage.getItem("token");
    
    if (!token) {
      return {
        success: false,
        message: "You must be logged in to update a product",
      };
    }

    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to update product",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      message: "An error occurred while updating the product",
    };
  }
}

export async function deleteProduct(
  productId: string
): Promise<ApiResponse<any>> {
  try {
    // Get token from localStorage
    const token = localStorage.getItem("token");
    
    if (!token) {
      return {
        success: false,
        message: "You must be logged in to delete a product",
      };
    }

    const response = await fetch(`${API_URL}/products/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to delete product",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      message: "An error occurred while deleting the product",
    };
  }
}

interface GetProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  sort?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

export async function getProducts(params: GetProductsParams = {}): Promise<ApiResponse<ProductsResponse>> {
  try {
    const { page = 1, limit = 12, category, sort, search, minPrice, maxPrice } = params;

    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    if (category && category !== "all") {
      queryParams.append("category", category);
    }
    if (sort) {
      queryParams.append("sort", sort);
    }
    if (search) {
      queryParams.append("search", search);
    }
    if (minPrice) {
      queryParams.append("minPrice", minPrice.toString());
    }
    if (maxPrice) {
      queryParams.append("maxPrice", maxPrice.toString());
    }

    const response = await fetch(`${API_URL}/products?${queryParams.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch products",
      };
    }

    return {
      success: true,
      data: {
        data: data.data || [],
        pagination: data.pagination || {
          page: 1,
          limit: 12,
          total: 0,
          pages: 0
        }
      },
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      success: false,
      message: "An error occurred while fetching products",
    };
  }
}

export async function getProductById(productId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch product",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return {
      success: false,
      message: "An error occurred while fetching the product",
    };
  }
}

// Helper function to transform backend product to frontend product
export function transformProduct(backendProduct: BackendProduct) {
  const categoryName = typeof backendProduct.category === 'object' 
    ? backendProduct.category.name 
    : 'Uncategorized';
  
  const categorySlug = typeof backendProduct.category === 'object' 
    ? backendProduct.category.slug 
    : 'uncategorized';

  const categoryId = typeof backendProduct.category === 'object' 
    ? backendProduct.category._id 
    : '';

  return {
    id: backendProduct._id,
    name: backendProduct.name,
    slug: backendProduct.slug,
    description: backendProduct.description || '',
    price: backendProduct.price,
    originalPrice: backendProduct.discountPrice,
    category: categoryName,
    categoryId: categoryId,
    categorySlug: categorySlug,
    image: backendProduct.images && backendProduct.images.length > 0 
      ? backendProduct.images[0].url 
      : '/placeholder.jpg',
    images: backendProduct.images?.map(img => img.url) || [],
    brand: backendProduct.brand || '',
    stock: backendProduct.stock,
    inStock: backendProduct.stock > 0,
    rating: backendProduct.ratings,
    reviews: backendProduct.numReviews,
    tags: backendProduct.tags || [],
    aiScore: backendProduct.aiScore,
    createdAt: backendProduct.createdAt,
    // Sizes and colors will be derived from tags if available
    sizes: [],
    colors: [],
  };
}

// Product type for frontend use
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  categoryId?: string;
  categorySlug: string;
  image: string;
  images: string[];
  brand: string;
  stock: number;
  inStock: boolean;
  rating: number;
  reviews: number;
  tags: string[];
  aiScore?: number;
  createdAt: string;
  sizes?: string[];
  colors?: string[];
}

export async function getFeaturedProducts(): Promise<ApiResponse<Product[]>> {
  try {
    const response = await fetch(`${API_URL}/products/featured?limit=4`);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch featured products",
      };
    }

    // Transform the backend products to frontend format
    const transformedProducts = (data.data || []).map(transformProduct);

    return {
      success: true,
      data: transformedProducts,
    };
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return {
      success: false,
      message: "An error occurred while fetching featured products",
    };
  }
}

// ==================== CART API FUNCTIONS ====================

// Backend cart item interface (raw data from API)
interface BackendCartItem {
  product: BackendProduct;
  quantity: number;
  price: number;
}

// Frontend cart item interface (transformed)
export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
}

interface CartData {
  _id: string;
  user: string;
  items: BackendCartItem[];
  totalPrice: number;
  couponCode?: string;
  discountAmount?: number;
  finalPrice?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transform backend product to frontend product
 * This is a separate function to avoid type conflicts
 */
function transformBackendToFrontend(backendProduct: BackendProduct): Product {
  const categoryName = typeof backendProduct.category === 'object' 
    ? backendProduct.category.name 
    : 'Uncategorized';
  
  const categorySlug = typeof backendProduct.category === 'object' 
    ? backendProduct.category.slug 
    : 'uncategorized';

  const categoryId = typeof backendProduct.category === 'object' 
    ? backendProduct.category._id 
    : '';

  return {
    id: backendProduct._id,
    name: backendProduct.name,
    slug: backendProduct.slug,
    description: backendProduct.description || '',
    price: backendProduct.price,
    originalPrice: backendProduct.discountPrice,
    category: categoryName,
    categoryId: categoryId,
    categorySlug: categorySlug,
    image: backendProduct.images && backendProduct.images.length > 0 
      ? backendProduct.images[0].url 
      : '/placeholder.jpg',
    images: backendProduct.images?.map(img => img.url) || [],
    brand: backendProduct.brand || '',
    stock: backendProduct.stock,
    inStock: backendProduct.stock > 0,
    rating: backendProduct.ratings,
    reviews: backendProduct.numReviews,
    tags: backendProduct.tags || [],
    aiScore: backendProduct.aiScore,
    createdAt: backendProduct.createdAt,
    sizes: [],
    colors: [],
  };
}

/**
 * Transform backend cart item to frontend cart item
 */
function transformCartItem(backendItem: BackendCartItem): CartItem {
  return {
    product: transformBackendToFrontend(backendItem.product),
    quantity: backendItem.quantity,
    price: backendItem.price,
  };
}

/**
 * Transform backend cart to frontend format
 */
export function transformCart(cartData: CartData) {
  return {
    _id: cartData._id,
    user: cartData.user,
    items: cartData.items.map(transformCartItem),
    totalPrice: cartData.totalPrice,
    couponCode: cartData.couponCode,
    discountAmount: cartData.discountAmount,
    finalPrice: cartData.finalPrice,
    createdAt: cartData.createdAt,
    updatedAt: cartData.updatedAt,
  };
}

/**
 * Get user's cart from backend
 */
export async function getCart(): Promise<ApiResponse<CartData>> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        success: false,
        message: "You must be logged in to view cart",
      };
    }

    const response = await fetch(`${API_URL}/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch cart",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error fetching cart:", error);
    return {
      success: false,
      message: "An error occurred while fetching cart",
    };
  }
}

/**
 * Add item to cart
 */
export async function addToCart(
  productId: string,
  quantity: number = 1
): Promise<ApiResponse<CartData>> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        success: false,
        message: "You must be logged in to add items to cart",
      };
    }

    const response = await fetch(`${API_URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, quantity }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to add item to cart",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error adding to cart:", error);
    return {
      success: false,
      message: "An error occurred while adding to cart",
    };
  }
}

/**
 * Update cart item quantity
 */
export async function updateCartItem(
  productId: string,
  quantity: number
): Promise<ApiResponse<CartData>> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        success: false,
        message: "You must be logged in to update cart",
      };
    }

    const response = await fetch(`${API_URL}/cart/${productId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ quantity }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to update cart item",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error updating cart item:", error);
    return {
      success: false,
      message: "An error occurred while updating cart item",
    };
  }
}

/**
 * Remove item from cart
 */
export async function removeFromCart(
  productId: string
): Promise<ApiResponse<CartData>> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        success: false,
        message: "You must be logged in to remove items from cart",
      };
    }

    const response = await fetch(`${API_URL}/cart/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to remove item from cart",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error removing from cart:", error);
    return {
      success: false,
      message: "An error occurred while removing from cart",
    };
  }
}

/**
 * Clear all items from cart
 */
export async function clearCart(): Promise<ApiResponse<CartData>> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        success: false,
        message: "You must be logged in to clear cart",
      };
    }

    const response = await fetch(`${API_URL}/cart`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to clear cart",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error clearing cart:", error);
    return {
      success: false,
      message: "An error occurred while clearing cart",
    };
  }
}

// ==================== ORDER API FUNCTIONS ====================

// Backend order interface
interface BackendOrder {
  _id: string;
  user: string;
  orderItems: {
    product: string | BackendProduct;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  paymentInfo: {
    id: string;
    status: string;
  };
  totalPrice: number;
  shippingCost?: number;
  tax?: number;
  orderStatus: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Shipping address interface
interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Payment info interface
interface PaymentInfo {
  id: string;
  status: string;
}

// Create order data interface
interface CreateOrderData {
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  paymentInfo?: PaymentInfo;
}

/**
 * Create a new order
 */
export async function createOrder(orderData: CreateOrderData): Promise<ApiResponse<BackendOrder>> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        success: false,
        message: "You must be logged in to create an order",
      };
    }

    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to create order",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error creating order:", error);
    return {
      success: false,
      message: "An error occurred while creating the order",
    };
  }
}

/**
 * Get user's orders
 */
export async function getOrders(page: number = 1, limit: number = 10): Promise<ApiResponse<any>> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        success: false,
        message: "You must be logged in to view orders",
      };
    }

    const response = await fetch(`${API_URL}/orders?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch orders",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      success: false,
      message: "An error occurred while fetching orders",
    };
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<ApiResponse<BackendOrder>> {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      return {
        success: false,
        message: "You must be logged in to view order details",
      };
    }

    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to fetch order",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    return {
      success: false,
      message: "An error occurred while fetching the order",
    };
  }
}

