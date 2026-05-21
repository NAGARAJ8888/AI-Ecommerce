import jwt from 'jsonwebtoken';
import User from '../../models/user.js';

export const verifyAccessToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select('-password');
  if (!user) return null;
  return user;
};

