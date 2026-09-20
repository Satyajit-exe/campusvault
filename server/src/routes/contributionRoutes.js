import express from 'express';
import { Resource } from '../models/Resource.js';
import { Subject } from '../models/Subject.js';
import { User } from '../models/User.js';
import { storageService } from '../services/storage/StorageService.js';
import { authenticate } from '../middleware/auth.js';
import { uploadPdf, validatePdfMagicBytes } from '../middleware/uploadMiddleware.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticate);

function generateSlug(title) {
  const clean = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80);
  return `${clean}-${Date.now().toString().slice(-6)}`;
}

// GET /api/contributions/my - student contribution history
router.get('/my', async (req, res, next) => {
  try {
    const contributions = await Resource.find({ uploadedBy: req.user._id })
      .populate('subject', 'name code slug')
      .populate('college', 'name code')
      .populate('branch', 'name code')
      .populate('module', 'moduleNumber title')
      .sort({ createdAt: -1 })
      .lean();

    const sanitized = contributions.map((c) => {
      delete c.fileKey;
      delete c.uniqueViewers;
      return c;
    });

    res.json({
      success: true,
      contributions: sanitized,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/contributions/upload - student uploads a PDF resource
router.post(
  '/upload',
  uploadLimiter,
  uploadPdf.single('pdf'),
  validatePdfMagicBytes,
  async (req, res, next) => {
    try {
      const user = req.user;
      const {
        title,
        description,
        subjectId,
        moduleId,
        materialType,
        examType,
        examYear,
        topicsCovered,
        source,
        sourceType,
      } = req.body;

      if (!title || !subjectId || !materialType) {
        return res.status(400).json({
          success: false,
          message: 'Title, subject, and material type are required fields.',
        });
      }

      const subject = await Subject.findById(subjectId);
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found.' });
      }

      // Validate student academic context (unless admin)
      if (user.role === 'STUDENT' || user.role === 'CONTRIBUTOR') {
        const userBranchId = (user.branch?._id || user.branch)?.toString();
        if (userBranchId && subject.branch.toString() !== userBranchId) {
          return res.status(403).json({
            success: false,
            message: 'You can only contribute materials for your current branch.',
          });
        }
      }

      // Upload file safely through Storage abstraction
      const uploadResult = await storageService.uploadFile({
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimeType: req.file.mimetype,
      });

      // Parse topics covered if string
      let parsedTopics = [];
      if (topicsCovered) {
        if (Array.isArray(topicsCovered)) parsedTopics = topicsCovered;
        else parsedTopics = topicsCovered.split(',').map((t) => t.trim()).filter(Boolean);
      }

      const slug = generateSlug(title);

      const newResource = await Resource.create({
        title: title.trim(),
        slug,
        description: (description || '').trim(),
        fileKey: uploadResult.fileKey,
        cloudUrl: uploadResult.cloudUrl || null,
        storageProvider: uploadResult.storageProvider || 'cloudinary',
        fileSize: uploadResult.fileSize,
        mimeType: uploadResult.mimeType,
        college: user.college._id || user.college,
        course: user.course._id || user.course,
        branch: user.branch._id || user.branch,
        academicYear: user.currentAcademicYear,
        semesterNumber: user.currentSemester,
        subject: subject._id,
        module: moduleId || null,
        materialType,
        examType: examType || 'None',
        examYear: examYear ? Number(examYear) : new Date().getFullYear(),
        topicsCovered: parsedTopics,
        source: source || 'Student Contribution',
        sourceType: sourceType || 'Student-created',
        permissionStatus: 'Pending',
        status: 'pending', // ALWAYS pending review for student uploads!
        uploadedBy: user._id,
      });

      // Automatically upgrade student role to CONTRIBUTOR if not already
      if (user.role === 'STUDENT') {
        user.role = 'CONTRIBUTOR';
        user.contributionCount = (user.contributionCount || 0) + 1;
        await user.save();
      }

      res.status(201).json({
        success: true,
        message: 'Resource submitted successfully! Our moderators will review it shortly.',
        resource: {
          _id: newResource._id,
          title: newResource.title,
          slug: newResource.slug,
          status: newResource.status,
          createdAt: newResource.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/contributions/:id - edit pending or rejected submission
router.put('/:id', async (req, res, next) => {
  try {
    const resource = await Resource.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
    });

    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    if (resource.status === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Approved resources cannot be edited directly. Please submit a correction request.',
      });
    }

    const { title, description, moduleId, materialType, examType, examYear, topicsCovered, source, sourceType } =
      req.body;

    if (title) resource.title = title.trim();
    if (description !== undefined) resource.description = description.trim();
    if (moduleId !== undefined) resource.module = moduleId || null;
    if (materialType) resource.materialType = materialType;
    if (examType) resource.examType = examType;
    if (examYear) resource.examYear = Number(examYear);
    if (source) resource.source = source;
    if (sourceType) resource.sourceType = sourceType;

    if (topicsCovered) {
      resource.topicsCovered = Array.isArray(topicsCovered)
        ? topicsCovered
        : topicsCovered.split(',').map((t) => t.trim()).filter(Boolean);
    }

    // Reset status to pending review upon resubmission
    resource.status = 'pending';
    resource.rejectionReason = '';
    await resource.save();

    res.json({
      success: true,
      message: 'Contribution updated and resubmitted for admin review.',
      resource,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/contributions/:id - cancel pending submission
router.delete('/:id', async (req, res, next) => {
  try {
    const resource = await Resource.findOne({
      _id: req.params.id,
      uploadedBy: req.user._id,
      status: 'pending',
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Pending resource not found or cannot be cancelled.',
      });
    }

    // Delete stored file
    await storageService.deleteFile(resource.fileKey, resource.storageProvider);
    await Resource.findByIdAndDelete(resource._id);

    res.json({
      success: true,
      message: 'Pending submission cancelled and removed.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
