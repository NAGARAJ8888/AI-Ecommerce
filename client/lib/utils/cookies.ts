export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    new RegExp("(^|;\\s*)" + name + "=([^;]*)")
  );

  return match ? decodeURIComponent(match[2]) : null;
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
