export function sendSuccess(res, payload = {}) {
  // Preserve existing controller shape as much as possible.
  // Default to { success: true, ...payload }
  return res.json({ success: true, ...payload });
}

export function sendError(res, { statusCode = 500, message = "Server Error", details } = {}) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : undefined)
  });
}

