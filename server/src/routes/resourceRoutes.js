import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Resource } from '../models/Resource.js';
import { storageService } from '../services/storage/StorageService.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = express.Router();

async function findResourceByIdOrSlug(identifier) {
  if (!identifier) return null;
  const trimmed = identifier.toString().trim();
  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const byId = await Resource.findById(trimmed);
    if (byId) return byId;
  }
  return Resource.findOne({ slug: trimmed.toLowerCase() });
}

async function findResourcePopulated(identifier) {
  if (!identifier) return null;
  const trimmed = identifier.toString().trim();
  const populateFields = [
    { path: 'subject', select: 'name code slug credits semesterNumber' },
    { path: 'college', select: 'name code slug' },
    { path: 'branch', select: 'name code' },
    { path: 'module', select: 'moduleNumber title' },
    { path: 'uploadedBy', select: 'fullName email' },
  ];

  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const byId = await Resource.findById(trimmed).populate(populateFields).lean();
    if (byId) return byId;
  }
  return Resource.findOne({ slug: trimmed.toLowerCase() }).populate(populateFields).lean();
}

// GET /api/resources - filtered catalog
router.get('/', async (req, res, next) => {
  try {
    const {
      college,
      course,
      branch,
      semester,
      subject,
      module,
      materialType,
      examType,
      year,
      limit = 20,
      page = 1,
    } = req.query;

    const query = { status: 'approved' };
    if (college) query.college = college;
    if (course) query.course = course;
    if (branch) query.branch = branch;
    if (semester) query.semesterNumber = Number(semester);
    if (subject) query.subject = subject;
    if (module) query.module = module;
    if (materialType) query.materialType = materialType;
    if (examType && examType !== 'All') query.examType = examType;
    if (year) query.examYear = Number(year);

    const skip = (Number(page) - 1) * Number(limit);

    const [resources, total] = await Promise.all([
      Resource.find(query)
        .populate('subject', 'name code slug')
        .populate('college', 'name code')
        .populate('branch', 'name code')
        .sort({ trendingScore: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Resource.countDocuments(query),
    ]);

    // Sanitize output
    const sanitized = resources.map((r) => {
      delete r.fileKey;
      delete r.uniqueViewers;
      return r;
    });

    res.json({
      success: true,
      resources: sanitized,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/resources/trending - trending, recently added, most viewed
router.get('/trending', async (req, res, next) => {
  try {
    const [trending, recentlyAdded, mostViewed] = await Promise.all([
      Resource.find({ status: 'approved' })
        .populate('subject', 'name code slug')
        .populate('branch', 'name code')
        .sort({ trendingScore: -1 })
        .limit(6)
        .lean(),
      Resource.find({ status: 'approved' })
        .populate('subject', 'name code slug')
        .populate('branch', 'name code')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
      Resource.find({ status: 'approved' })
        .populate('subject', 'name code slug')
        .populate('branch', 'name code')
        .sort({ viewsCount: -1 })
        .limit(6)
        .lean(),
    ]);

    const sanitize = (list) =>
      list.map((r) => {
        delete r.fileKey;
        delete r.uniqueViewers;
        return r;
      });

    res.json({
      success: true,
      data: {
        trending: sanitize(trending),
        recentlyAdded: sanitize(recentlyAdded),
        mostViewed: sanitize(mostViewed),
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/resources/:id - resource details (supports both ObjectId and slug)
router.get('/:id', optionalAuthenticate, async (req, res, next) => {
  try {
    const resource = await findResourcePopulated(req.params.id);

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // Only admins or the uploader can view non-approved resources
    if (resource.status !== 'approved') {
      const uploaderId = resource.uploadedBy?._id ? resource.uploadedBy._id.toString() : resource.uploadedBy?.toString();
      const isOwner = req.user && req.user._id.toString() === uploaderId;
      const isAdmin = req.user && req.user.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Resource is under review' });
      }
    }

    delete resource.fileKey;
    delete resource.uniqueViewers;

    res.json({ success: true, resource });
  } catch (error) {
    next(error);
  }
});

// GET /api/resources/:id/stream - SECURE PDF STREAMING (supports both ObjectId and slug)
// Validates session, streams file directly, never exposes cloud/disk storage URL
router.get('/:id/stream', optionalAuthenticate, async (req, res, next) => {
  try {
    const resource = await findResourceByIdOrSlug(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    if (resource.status !== 'approved') {
      const uploaderId = resource.uploadedBy?._id ? resource.uploadedBy._id.toString() : resource.uploadedBy?.toString();
      const isOwner = req.user && req.user._id.toString() === uploaderId;
      const isAdmin = req.user && req.user.role === 'ADMIN';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Resource is not publicly available' });
      }
    }

    // Track unique and total views
    const viewerIdentifier = req.user
      ? `user_${req.user._id}`
      : `ip_${crypto.createHash('sha256').update(req.ip || req.connection.remoteAddress || 'unknown').digest('hex').slice(0, 16)}`;

    resource.viewsCount += 1;
    if (!resource.uniqueViewers) {
      resource.uniqueViewers = [];
    }
    if (!resource.uniqueViewers.includes(viewerIdentifier)) {
      resource.uniqueViewers.push(viewerIdentifier);
      resource.uniqueViewsCount = resource.uniqueViewers.length;
    }
    resource.calculateTrendingScore();
    await resource.save();

    // Stream PDF data directly through backend
    const { stream, size, mimeType } = await storageService.getFileStream(
      resource.fileKey,
      resource.storageProvider
    );

    res.set({
      'Content-Type': mimeType || 'application/pdf',
      'Content-Length': size,
      'Content-Disposition': 'inline; filename="campusvault-document.pdf"',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    stream.pipe(res);
  } catch (error) {
    console.error('Error streaming PDF resource:', error);
    next(error);
  }
});

// GET /api/resources/:id/admin-download - ADMIN ONLY download for moderation
router.get('/:id/admin-download', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const resource = await findResourceByIdOrSlug(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const { stream, size } = await storageService.getFileStream(
      resource.fileKey,
      resource.storageProvider
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Length': size,
      'Content-Disposition': `attachment; filename="${resource.slug || 'document'}.pdf"`,
    });

    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

export default router;
