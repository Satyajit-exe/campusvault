import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

function createToken(userId) {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function setAuthCookie(res, token) {
  const isProduction = env.nodeEnv === 'production';
  res.cookie('cv_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      college,
      course,
      branch,
      admissionYear,
      currentAcademicYear,
      currentSemester,
    } = req.body;

    if (!fullName || !email || !password || !college || !course || !branch || !admissionYear || !currentSemester) {
      return res.status(400).json({
        success: false,
        message: 'All registration fields are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password,
      role: 'STUDENT',
      college,
      course,
      branch,
      admissionYear: Number(admissionYear),
      currentAcademicYear: currentAcademicYear || '2025-26',
      currentSemester: Number(currentSemester),
    });

    const token = createToken(user._id);
    setAuthCookie(res, token);

    const populatedUser = await User.findById(user._id)
      .populate('college', 'name code slug')
      .populate('course', 'name code')
      .populate('branch', 'name code');

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: {
        _id: populatedUser._id,
        fullName: populatedUser.fullName,
        email: populatedUser.email,
        role: populatedUser.role,
        college: populatedUser.college,
        course: populatedUser.course,
        branch: populatedUser.branch,
        admissionYear: populatedUser.admissionYear,
        currentAcademicYear: populatedUser.currentAcademicYear,
        currentSemester: populatedUser.currentSemester,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('college', 'name code slug')
      .populate('course', 'name code')
      .populate('branch', 'name code');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const token = createToken(user._id);
    setAuthCookie(res, token);

    res.json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        college: user.college,
        course: user.course,
        branch: user.branch,
        admissionYear: user.admissionYear,
        currentAcademicYear: user.currentAcademicYear,
        currentSemester: user.currentSemester,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('cv_token');
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// POST /api/auth/forgot-password (mock/simulated email reset)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  // Simulate sending reset instructions
  res.json({
    success: true,
    message: 'If an account exists with this email, password reset instructions have been dispatched.',
  });
});

export default router;
