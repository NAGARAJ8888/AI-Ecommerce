import { getCookie } from "@/lib/utils/cookies";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
};

function isLoggedOut(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem("auth:loggedOut") === "1";
}

function isUnsafeMethod(method: string | undefined): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes((method || "GET").toUpperCase());
}

function requestInterceptor(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers || {});

  if (isUnsafeMethod(init.method)) {
    const csrf = getCookie("XSRF-TOKEN");
    console.log("FETCHWITHAUTH CSRF:", csrf);
    headers.set("X-CSRF-Token", csrf || "");
  }

  console.log("FINAL HEADERS:", headers);

  return {
    ...init,
    credentials: "include",
    headers
  };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, message: data?.message || `Request failed: ${res.status}`, status: res.status };
  }
  return data;
}

async function attemptSilentRefresh(): Promise<boolean> {
  if (isLoggedOut()) return false;

  try {
    const refreshInit = requestInterceptor({
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      }
    });
    const refreshRes = await fetch(`${API_URL}/users/refresh`, refreshInit);

    if (!refreshRes.ok) return false;
    return true;
  } catch {
    return false;
  }
}

export async function fetchWithAuth<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  // Always send cookies
  const attempt = async () => {
    const requestInit = requestInterceptor(init);
    return fetchJson<T>(url, requestInit);
  };

  const resp = await attempt();

  // If unauthorized, attempt silent refresh once.
  if (resp && resp.success === false && resp.status === 401) {
    if (isLoggedOut()) return resp;

    const ok = await attemptSilentRefresh();
    if (!ok) return resp;
    return attempt();
  }

  return resp;
}

