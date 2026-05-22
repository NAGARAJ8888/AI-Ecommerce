import { getCsrfToken, setCsrfToken } from "./csrfStore";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

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
  return ["POST", "PUT", "PATCH", "DELETE"].includes(
    (method || "GET").toUpperCase()
  );
}

function requestInterceptor(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers || {});

  if (isUnsafeMethod(init.method)) {
    const csrf = getCsrfToken();

    console.log("CSRF MEMORY TOKEN:", csrf);

    headers.set("X-CSRF-Token", csrf || "");
  }

  return {
    ...init,
    credentials: "include",
    headers,
  };
}

async function fetchJson<T>(
  url: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(url, init);

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    return {
      success: false,
      message: data?.message || `Request failed: ${res.status}`,
      status: res.status,
    };
  }

  return data;
}

async function ensureCsrfCookie(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/users/csrf`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    const data = await res.json();

    if (data?.csrfToken) {
      setCsrfToken(data.csrfToken);

      console.log(
        "CSRF TOKEN STORED:",
        data.csrfToken?.length || 0
      );
    }

    return res.ok;
  } catch (error) {
    console.error("Failed to initialize CSRF token:", error);

    return false;
  }
}

async function attemptSilentRefresh(): Promise<boolean> {
  if (isLoggedOut()) return false;

  await ensureCsrfCookie();

  try {
    const refreshInit = requestInterceptor({
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const refreshRes = await fetch(
      `${API_URL}/users/refresh`,
      refreshInit
    );

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
  const url = path.startsWith("http")
    ? path
    : `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const attempt = async () => {
    // Ensure CSRF token exists before unsafe requests
    if (isUnsafeMethod(init.method)) {
      await ensureCsrfCookie();
    }

    const requestInit = requestInterceptor(init);

    const headerDebug =
      requestInit.headers instanceof Headers
        ? requestInit.headers.get("X-CSRF-Token") || ""
        : (requestInit.headers as any)?.["X-CSRF-Token"] || "";

    console.log(
      "FINAL X-CSRF-Token LENGTH:",
      headerDebug ? String(headerDebug).length : 0
    );

    return fetchJson<T>(url, requestInit);
  };

  const resp = await attempt();

  // Attempt silent refresh once if unauthorized
  if (resp && resp.success === false && resp.status === 401) {
    if (isLoggedOut()) return resp;

    const ok = await attemptSilentRefresh();

    if (!ok) return resp;

    return attempt();
  }

  return resp;
}