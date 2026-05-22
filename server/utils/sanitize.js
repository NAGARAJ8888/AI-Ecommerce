export function sanitizeString(input, { maxLength = 500 } = {}) {
  if (typeof input !== "string") return input;
  const s = input.trim();
  if (s.length > maxLength) return s.slice(0, maxLength);
  return s;
}

