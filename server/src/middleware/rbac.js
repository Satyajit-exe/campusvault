export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

export function requireAdmin(req, res, next) {
  return requireRole('ADMIN')(req, res, next);
}

export function requireContributorOrAdmin(req, res, next) {
  return requireRole('CONTRIBUTOR', 'ADMIN')(req, res, next);
}
