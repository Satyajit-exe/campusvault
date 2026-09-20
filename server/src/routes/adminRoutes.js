import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { Resource } from '../models/Resource.js';
import { User } from '../models/User.js';
import { College } from '../models/College.js';
import { Course } from '../models/Course.js';
import { Branch } from '../models/Branch.js';
import { Subject } from '../models/Subject.js';
import { Module } from '../models/Module.js';
import { AcademicYear } from '../models/AcademicYear.js';
import { CopyrightReport } from '../models/CopyrightReport.js';
import { MaterialRequest } from '../models/MaterialRequest.js';
import { AuditLog } from '../models/AuditLog.js';
import { Bookmark } from '../models/Bookmark.js';
import { StudyProgress } from '../models/StudyProgress.js';
import { Advertisement } from '../models/Advertisement.js';
import { storageService } from '../services/storage/StorageService.js';
import { uploadPdf, validatePdfMagicBytes } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All admin routes strictly require ADMIN role
router.use(authenticate, requireAdmin);

// Helper for audit logging
async function logAdminAction(adminId, action, targetType, targetId, details, req) {
  try {
    await AuditLog.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      details,
      ipAddress: req.ip || '',
    });
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// GET /api/admin/dashboard - analytics overview
router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      totalResources,
      pendingContributions,
      totalUsers,
      totalSubjects,
      pendingReports,
      pendingRequests,
      recentAuditLogs,
    ] = await Promise.all([
      Resource.countDocuments({ status: 'approved' }),
      Resource.countDocuments({ status: 'pending' }),
      User.countDocuments(),
      Subject.countDocuments(),
      CopyrightReport.countDocuments({ status: 'pending' }),
      MaterialRequest.countDocuments({ status: 'pending' }),
      AuditLog.find().populate('admin', 'fullName email').sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    // Aggregate total views and saves
    const metrics = await Resource.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$viewsCount' },
          totalUniqueViews: { $sum: '$uniqueViewsCount' },
          totalSaves: { $sum: '$savesCount' },
        },
      },
    ]);

    const stats = metrics[0] || { totalViews: 0, totalUniqueViews: 0, totalSaves: 0 };

    res.json({
      success: true,
      data: {
        totalResources,
        pendingContributions,
        totalUsers,
        totalSubjects,
        pendingReports,
        pendingRequests,
        totalViews: stats.totalViews,
        totalUniqueViews: stats.totalUniqueViews,
        totalSaves: stats.totalSaves,
        recentAuditLogs,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/contributions/pending
router.get('/contributions/pending', async (req, res, next) => {
  try {
    const pending = await Resource.find({ status: 'pending' })
      .populate('subject', 'name code slug')
      .populate('college', 'name code')
      .populate('branch', 'name code')
      .populate('uploadedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, contributions: pending });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/contributions/:id/review - approve or reject
router.post('/contributions/:id/review', async (req, res, next) => {
  try {
    const { action, rejectionReason } = req.body; // action: 'approve' | 'reject'
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    if (action === 'approve') {
      resource.status = 'approved';
      resource.approvedBy = req.user._id;
      resource.approvedAt = new Date();
      resource.rejectionReason = '';
      resource.calculateTrendingScore();
      await resource.save();

      await logAdminAction(req.user._id, 'APPROVE_RESOURCE', 'Resource', resource._id, { title: resource.title }, req);

      return res.json({ success: true, message: 'Resource approved and published!', resource });
    } else if (action === 'reject') {
      resource.status = 'rejected';
      resource.rejectionReason = rejectionReason || 'Content does not meet CampusVault quality or legal guidelines.';
      await resource.save();

      await logAdminAction(req.user._id, 'REJECT_RESOURCE', 'Resource', resource._id, { rejectionReason }, req);

      return res.json({ success: true, message: 'Resource rejected with feedback.', resource });
    }

    res.status(400).json({ success: false, message: 'Invalid review action' });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/resources - full list with filters
router.get('/resources', async (req, res, next) => {
  try {
    const { status, subject, limit = 50, page = 1 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (subject) query.subject = subject;

    const skip = (Number(page) - 1) * Number(limit);
    const [resources, total] = await Promise.all([
      Resource.find(query)
        .populate('subject', 'name code')
        .populate('uploadedBy', 'fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Resource.countDocuments(query),
    ]);

    res.json({ success: true, resources, total });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/resources - admin upload resource directly
router.post(
  '/resources',
  uploadPdf.single('pdf'),
  validatePdfMagicBytes,
  async (req, res, next) => {
    try {
      const {
        title,
        description,
        college,
        course,
        branch,
        academicYear,
        semesterNumber,
        subject,
        module,
        materialType,
        examType,
        examYear,
        topicsCovered,
        sourceType,
      } = req.body;

      const uploadResult = await storageService.uploadFile({
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimeType: req.file.mimetype,
      });

      const cleanSlug = `${title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')}-${Date.now().toString().slice(-6)}`;

      let topics = [];
      if (topicsCovered) {
        topics = Array.isArray(topicsCovered) ? topicsCovered : topicsCovered.split(',').map((t) => t.trim());
      }

      const resource = await Resource.create({
        title,
        slug: cleanSlug,
        description,
        fileKey: uploadResult.fileKey,
        cloudUrl: uploadResult.cloudUrl || null,
        storageProvider: uploadResult.storageProvider || 'cloudinary',
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        college,
        course,
        branch,
        academicYear: academicYear || '2025-26',
        semesterNumber: Number(semesterNumber),
        subject,
        module: module || null,
        materialType,
        examType: examType || 'None',
        examYear: examYear ? Number(examYear) : new Date().getFullYear(),
        topicsCovered: topics,
        source: 'Faculty / Admin Verified',
        sourceType: sourceType || 'Official',
        permissionStatus: 'Official',
        status: 'approved', // Admin uploads are published immediately
        uploadedBy: req.user._id,
        approvedBy: req.user._id,
        approvedAt: new Date(),
      });

      await logAdminAction(req.user._id, 'ADMIN_UPLOAD', 'Resource', resource._id, { title }, req);

      res.status(201).json({ success: true, resource });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/admin/resources/:id/status - publish, unpublish, archive
router.put('/resources/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body; // 'approved' | 'pending' | 'archived' | 'rejected'
    const resource = await Resource.findByIdAndUpdate(req.params.id, { status }, { new: true });
    await logAdminAction(req.user._id, 'CHANGE_STATUS', 'Resource', resource._id, { newStatus: status }, req);
    res.json({ success: true, resource });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/reports - copyright reports
router.get('/reports', async (req, res, next) => {
  try {
    const reports = await CopyrightReport.find()
      .populate('resource', 'title slug fileKey storageProvider status')
      .populate('resolvedBy', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, reports });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/reports/:id/action - take moderation action on copyright concern
router.post('/reports/:id/action', async (req, res, next) => {
  try {
    const { action, adminNotes } = req.body;
    // action: 'unpublish' | 'archive' | 'dismiss'
    const report = await CopyrightReport.findById(req.params.id).populate('resource');
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (action === 'unpublish') {
      if (report.resource) {
        report.resource.status = 'rejected';
        report.resource.rejectionReason = 'Removed due to copyright report inquiry.';
        await report.resource.save();
      }
      report.status = 'action_taken';
      report.actionTaken = 'Resource Unpublished';
    } else if (action === 'archive') {
      if (report.resource) {
        report.resource.status = 'archived';
        await report.resource.save();
      }
      report.status = 'action_taken';
      report.actionTaken = 'Resource Archived';
    } else if (action === 'dismiss') {
      report.status = 'dismissed';
      report.actionTaken = 'Report Dismissed';
    }

    report.adminNotes = adminNotes || '';
    report.resolvedBy = req.user._id;
    report.resolvedAt = new Date();
    await report.save();

    await logAdminAction(req.user._id, 'RESOLVE_COPYRIGHT_REPORT', 'CopyrightReport', report._id, { action, adminNotes }, req);

    res.json({ success: true, message: 'Report updated and moderation action completed.', report });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/requests - student material requests
router.get('/requests', async (req, res, next) => {
  try {
    const requests = await MaterialRequest.find()
      .populate('subject', 'name code')
      .sort({ requestCount: -1, createdAt: -1 })
      .lean();

    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/requests/:id/fulfill
router.put('/requests/:id/fulfill', async (req, res, next) => {
  try {
    const { resourceId } = req.body;
    const request = await MaterialRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    request.status = 'fulfilled';
    if (resourceId) request.fulfilledResource = resourceId;
    await request.save();

    await logAdminAction(req.user._id, 'FULFILL_REQUEST', 'MaterialRequest', request._id, { resourceId }, req);

    res.json({ success: true, message: 'Material request marked as fulfilled!', request });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users - manage users
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('college', 'name code')
      .populate('branch', 'name code')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/users/:id/role - update role or status
router.put('/users/:id', async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const update = {};
    if (role) update.role = role;
    if (isActive !== undefined) update.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    await logAdminAction(req.user._id, 'UPDATE_USER', 'User', user._id, update, req);

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

// CRUD for Hierarchy (Colleges, Courses, Branches, Subjects, Modules)
router.post('/colleges', async (req, res, next) => {
  try {
    const { name, code, location } = req.body;
    const slug = code.toLowerCase();
    const college = await College.create({ name, code, slug, location });
    res.status(201).json({ success: true, college });
  } catch (error) {
    next(error);
  }
});

router.post('/subjects', async (req, res, next) => {
  try {
    const { name, code, slug, semesterNumber, branch, course, college, credits, description } = req.body;
    const subject = await Subject.create({
      name,
      code,
      slug: (slug || code).toLowerCase(),
      semesterNumber: Number(semesterNumber),
      branch,
      course,
      college,
      credits: credits || 4,
      description: description || '',
    });
    res.status(201).json({ success: true, subject });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/subjects/:id - delete subject with cascading cleanup of associated data
router.delete('/subjects/:id', async (req, res, next) => {
  try {
    const subject = await Subject.findById(req.params.id);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // 1. Find all associated resources to delete their files and bookmarks
    const resources = await Resource.find({ subject: subject._id });
    const resourceIds = resources.map((r) => r._id);

    // 2. Clean up storage files for associated resources
    for (const r of resources) {
      try {
        if (r.fileKey) {
          await storageService.deleteFile(r.fileKey, r.storageProvider);
        }
      } catch (fileErr) {
        console.error(`Failed to delete storage file for resource ${r._id}:`, fileErr);
      }
    }

    // 3. Cascade delete dependent documents
    await Promise.all([
      Bookmark.deleteMany({ resource: { $in: resourceIds } }),
      StudyProgress.deleteMany({ $or: [{ subject: subject._id }, { resource: { $in: resourceIds } }] }),
      MaterialRequest.deleteMany({ subject: subject._id }),
      Resource.deleteMany({ subject: subject._id }),
      Module.deleteMany({ subject: subject._id }),
    ]);

    // 4. Delete the subject document itself
    await Subject.findByIdAndDelete(subject._id);

    // 5. Record admin audit log
    await logAdminAction(
      req.user._id,
      'DELETE_SUBJECT',
      'Subject',
      subject._id,
      {
        name: subject.name,
        code: subject.code,
        resourcesDeletedCount: resources.length,
      },
      req
    );

    res.json({
      success: true,
      message: `Subject "${subject.name}" (${subject.code}) and all associated records deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/modules', async (req, res, next) => {
  try {
    const { moduleNumber, title, subject, topics } = req.body;
    const mod = await Module.create({
      moduleNumber: Number(moduleNumber),
      title,
      subject,
      topics: topics || [],
    });
    res.status(201).json({ success: true, module: mod });
  } catch (error) {
    next(error);
  }
});

// Advertisements (monetization placeholder)
router.get('/advertisements', async (req, res, next) => {
  try {
    const ads = await Advertisement.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, advertisements: ads });
  } catch (error) {
    next(error);
  }
});

export default router;
