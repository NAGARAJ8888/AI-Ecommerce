export const getCookieOptions = ({
  req,
  type,
  maxAgeMs
}) => {
  const isProd = process.env.NODE_ENV === 'production';

  const sameSite = process.env.COOKIE_SAMESITE || 'lax'; // 'lax' recommended for most SaaS SPAs

  const opts = {
    httpOnly: type === 'refresh',
    secure: isProd,
    sameSite: sameSite === 'strict' ? 'strict' : sameSite === 'none' ? 'none' : 'lax',
    path: type === 'refresh' ? '/api/users' : '/api',
    maxAge: maxAgeMs ? Math.floor(maxAgeMs / 1000) : undefined
  };

  // Allow overriding domain for multi-subdomain deployments.
  if (process.env.COOKIE_DOMAIN) {
    opts.domain = process.env.COOKIE_DOMAIN;
  }

  return opts;
};

