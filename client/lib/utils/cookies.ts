export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  // document.cookie is a semicolon-separated list.
  // Use a strict parse to avoid regex edge-cases with special characters.
  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const raw of cookies) {
    const part = raw.trim();
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq === -1) continue;

    const cookieName = part.slice(0, eq);
    if (cookieName !== name) continue;

    const cookieValue = part.slice(eq + 1);
    try {
      return decodeURIComponent(cookieValue);
    } catch {
      return cookieValue;
    }
  }

  return null;
}


type SetCookieOptions = {
  path?: string;
  maxAge?: number;
};

export function setCookie(
  name: string,
  value: string | boolean,
  options: SetCookieOptions = {}
): void {
  if (typeof document === "undefined") return;

  const cookieParts = [`${name}=${encodeURIComponent(String(value))}`];

  if (options.path) cookieParts.push(`path=${options.path}`);
  if (options.maxAge !== undefined) cookieParts.push(`max-age=${options.maxAge}`);

  document.cookie = cookieParts.join("; ");
}
