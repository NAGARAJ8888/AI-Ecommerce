const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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

