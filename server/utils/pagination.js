export function toInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export function clampPagination({ page, limit, maxLimit = 50, defaultPage = 1, defaultLimit = 10 }) {
  const safePage = Math.max(defaultPage, toInt(page, defaultPage));
  const safeLimit = Math.max(1, Math.min(maxLimit, toInt(limit, defaultLimit)));
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit };
}

