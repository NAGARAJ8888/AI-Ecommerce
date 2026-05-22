/**
 * STEP 7: regex safety helpers (no advanced regex engines; just guardrails).
 *
 * Prevents pathological regex patterns and caps size to avoid DoS.
 */

export function safeRegexFromString(input, { maxLength = 80, flags = "i" } = {}) {
  const s = typeof input === "string" ? input : "";
  const trimmed = s.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) return null;

  // Escape special regex chars; keeps behavior predictable.
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { pattern: escaped, flags };
}

