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

  // Double-submit CSRF: token must come from readable cookie
  if (isUnsafeMethod(init.method)) {
    const all = typeof document !== "undefined" ? document.cookie : "";
    const csrf = getCookie("XSRF-TOKEN");

    // Temporary client-side diagnostics (remove after fix)
    console.log("CSRF CLIENT DEBUG: document.cookie contains XSRF-TOKEN=", all.includes("XSRF-TOKEN="));
    console.log("CSRF CLIENT DEBUG: extracted csrf length=", csrf ? csrf.length : 0);
    console.log("CSRF CLIENT DEBUG: extracted csrf=", csrf);

    // Always set header key even if empty, to make it obvious in request diagnostics.
    headers.set("X-CSRF-Token", csrf || "");

  }

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

async function ensureCsrfCookie(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/users/csrf`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Accept": "application/json"
      }
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function attemptSilentRefresh(): Promise<boolean> {
  if (isLoggedOut()) return false;

  // Ensure CSRF cookie exists before refresh/logout-like calls.
  await ensureCsrfCookie();

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
    // For unsafe methods, make sure CSRF cookie exists first.
    if (isUnsafeMethod(init.method)) {
      const existingBefore = getCookie("XSRF-TOKEN");
      console.log("CSRF CLIENT DEBUG (before ensure): extracted csrf length=", existingBefore ? existingBefore.length : 0);

      if (!existingBefore) {
        await ensureCsrfCookie();
      }

      const existingAfter = getCookie("XSRF-TOKEN");
      console.log("CSRF CLIENT DEBUG (after ensure): extracted csrf length=", existingAfter ? existingAfter.length : 0);
    }

    const requestInit = requestInterceptor(init);

    const headerDebug = (requestInit.headers instanceof Headers)
      ? (requestInit.headers.get("X-CSRF-Token") || "")
      : (requestInit.headers as any)?.["X-CSRF-Token"] || "";

    console.log("CSRF CLIENT DEBUG: final request X-CSRF-Token length=", headerDebug ? String(headerDebug).length : 0);

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

