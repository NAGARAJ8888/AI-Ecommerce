import { verifyAccessToken } from './verifyAccessToken.js';

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.access_token;
    if (token) {
      req.user = await verifyAccessToken(token);
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  return next();
};

