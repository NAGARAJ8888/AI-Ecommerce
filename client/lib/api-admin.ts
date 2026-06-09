import { fetchWithAuth } from "./auth/fetchWithAuth";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export async function adminGetProductStats(): Promise<ApiResponse<any>> {
  const response = await fetchWithAuth<any>(`/products/admin/stats`, {
    method: "GET",
    credentials: "include",
  });

  return response;
}

export async function adminGetReviewStats(): Promise<ApiResponse<any>> {
  const response = await fetchWithAuth<any>(`/reviews/admin/stats`, {
    method: "GET",
    credentials: "include",
  });

  return response;
}

export async function adminGetRecommendationAnalytics(): Promise<ApiResponse<any>> {
  const response = await fetchWithAuth<any>(`/recommendations/admin/analytics`, {
    method: "GET",
    credentials: "include",
  });

  return response;
}

