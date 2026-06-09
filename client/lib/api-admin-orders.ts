import { fetchWithAuth } from "./auth/fetchWithAuth";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export type AdminOrderStatus = string;

export async function adminGetOrdersAll(params: {
  page?: number;
  limit?: number;
} = {}): Promise<ApiResponse<{ orders: unknown[]; data?: unknown[] }>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 25;

  const response = await fetchWithAuth<any>(`/orders/admin/all?page=${page}&limit=${limit}` , {
    method: "GET",
    credentials: "include",
  });

  return response;
}

export async function adminUpdateOrderStatus(params: {
  orderId: string;
  status: AdminOrderStatus;
}): Promise<ApiResponse<any>> {
  const { orderId, status } = params;

  const response = await fetchWithAuth<any>(`/orders/${orderId}/status`, {
    method: "PUT",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });

  return response;
}

export async function adminGetOrderStats(): Promise<ApiResponse<any>> {
  const response = await fetchWithAuth<any>(`/orders/admin/stats`, {
    method: "GET",
    credentials: "include",
  });

  return response;
}

