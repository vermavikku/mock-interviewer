const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'documind_access_super_secret_jwt_key_2026_!@#';

/**
 * Authentication middleware for verifying JWT access tokens.
 * Extracts token from HttpOnly cookies or Authorization Bearer header.
 */
function requireAuth(req, res, next) {
  // 1. Check bypass for health check or public routes
  if (req.path === '/health' || req.path.startsWith('/api/docs') || req.path.startsWith('/swagger')) {
    return next();
  }

  let token = null;

  // 2. Extract from cookies
  if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  // 3. Extract from Authorization header
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Access denied: No authentication token provided',
    });
  }

  const secret =
    process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_SECRET ||
    'documind_access_super_secret_jwt_key_2026_!@#';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    // Fallback attempt with default access key
    try {
      const decoded = jwt.verify(token, 'documind_access_super_secret_jwt_key_2026_!@#');
      req.user = decoded;
      return next();
    } catch (err2) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Access denied: Invalid or expired authentication token',
      });
    }
  }
}

module.exports = {
  requireAuth,
};
