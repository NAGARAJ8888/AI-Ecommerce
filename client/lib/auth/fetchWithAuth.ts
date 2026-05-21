const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

async function fetchJson<T>(url: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, message: data?.message || `Request failed: ${res.status}` };
  }
  return data;
}

async function attemptSilentRefresh(): Promise<boolean> {
  try {
    const refreshRes = await fetch(`${API_URL}/users/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        // Double-submit CSRF: echo XSRF-TOKEN cookie value
        "X-CSRF-Token": getCookie("XSRF-TOKEN") || ""
      }
    });

    if (!refreshRes.ok) return false;
    return true;
  } catch {
    return false;
  }
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const c of cookies) {
    const [k, ...v] = c.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export async function fetchWithAuth<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = path.startsWith("http") ? path : `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes((init.method || "GET").toUpperCase());

  const headers = new Headers(init.headers || {});

  if (unsafe) {
    // CSRF double-submit for cookie-based auth
    const csrf = getCookie("XSRF-TOKEN");
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }

  // Always send cookies
  const attempt = async () => {
    return fetchJson<T>(url, {
      ...init,
      credentials: "include",
      headers
    });
  };

  const resp = await attempt();

  // If unauthorized, attempt silent refresh once.
  if (resp && resp.success === false && resp.message?.toLowerCase().includes("not authorized")) {
    const ok = await attemptSilentRefresh();
    if (!ok) return resp;
    return attempt();
  }

  return resp;
}

