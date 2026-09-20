import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export async function authenticate(req, res, next) {
  try {
    let token = null;

    // Check HTTP-only cookie first
    if (req.cookies && req.cookies.cv_token) {
      token = req.cookies.cv_token;
    }
    // Check Authorization header fallback
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.userId)
      .populate('college', 'name code slug')
      .populate('course', 'name code')
      .populate('branch', 'name code');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User session expired or user not found.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token.',
    });
  }
}

// Optional authentication middleware: attaches user if token exists, but doesn't block if anonymous
export async function optionalAuthenticate(req, res, next) {
  try {
    let token = null;
    if (req.cookies && req.cookies.cv_token) {
      token = req.cookies.cv_token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = jwt.verify(token, env.jwtSecret);
      const user = await User.findById(decoded.userId)
        .populate('college', 'name code')
        .populate('course', 'name code')
        .populate('branch', 'name code');
      if (user && user.isActive) {
        req.user = user;
      }
    }
  } catch (err) {
    // Ignore errors for optional auth
  }
  next();
}
