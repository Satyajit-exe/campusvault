import { getMaintenanceState } from '../routes/systemRoutes.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export async function maintenanceMiddleware(req, res, next) {
  // Allow all system & health routes
  if (req.path.startsWith('/api/system') || req.path === '/api/health') {
    return next();
  }

  // Allow auth login & session check so admins can authenticate
  if (req.path.startsWith('/api/auth')) {
    return next();
  }

  const maintenance = await getMaintenanceState();
  if (!maintenance.enabled) {
    return next();
  }

  // If maintenance is enabled, check if requester is an ADMIN
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.cv_token;

    if (token) {
      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.id).select('role').lean();
      if (user && user.role === 'ADMIN') {
        // Admin bypasses maintenance mode
        return next();
      }
    }
  } catch (err) {
    // Ignore JWT decode error and proceed to block
  }

  // Block regular requests with 503
  return res.status(503).json({
    success: false,
    maintenance: true,
    message: maintenance.message || 'CampusVault is currently undergoing scheduled platform upgrades.',
    estimatedTime: maintenance.estimatedTime || 'Shortly',
  });
}
