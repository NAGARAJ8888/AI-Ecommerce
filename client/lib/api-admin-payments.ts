import { fetchWithAuth } from "./auth/fetchWithAuth";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export type AdminPaymentRefundReason = string;

export async function adminGetPaymentsAll(params: {
  page?: number;
  limit?: number;
} = {}): Promise<ApiResponse<{ payments: unknown[]; data?: unknown[] }>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 25;

  const response = await fetchWithAuth<any>(
    `/payments/admin/all?page=${page}&limit=${limit}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  return response;
}

export async function adminGetPaymentStats(): Promise<ApiResponse<any>> {
  const response = await fetchWithAuth<any>(`/payments/admin/stats`, {
    method: "GET",
    credentials: "include",
  });

  return response;
}

export async function adminRefundPayment(params: {
  paymentId: string;
  reason?: AdminPaymentRefundReason;
}): Promise<ApiResponse<any>> {
  const { paymentId, reason } = params;

  const response = await fetchWithAuth<any>(`/payments/${paymentId}/refund`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reason }),
  });

  return response;
}

