import { verifyAccessToken } from './verifyAccessToken.js';

// Cookie-based access auth middleware.
// Expects access token in cookie: access_token
export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, missing access token' });
    }

    const user = await verifyAccessToken(token);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authorized, invalid session' });
    }

    req.user = user;
    return next();
  } catch (err) {
    const msg = err?.name === 'TokenExpiredError' ? 'Access token expired' : 'Not authorized, token failed';
    return res.status(401).json({ success: false, message: msg });
  }
};

