import express from 'express';
import { StudyProgress } from '../models/StudyProgress.js';
import { Subject } from '../models/Subject.js';
import { Resource } from '../models/Resource.js';
import { authenticate } from '../middleware/auth.js';
import { findResourceByIdOrSlug } from '../utils/resourceHelper.js';

const router = express.Router();

router.use(authenticate);

// GET /api/progress - get user's study progress across subjects
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch subjects for student's current branch and semester
    const subjects = await Subject.find({
      branch: req.user.branch,
      semesterNumber: req.user.currentSemester,
      isActive: true,
    }).lean();

    // Fetch all study progress entries for this user
    const progressRecords = await StudyProgress.find({ user: userId })
      .populate('resource', 'title slug materialType pageCount')
      .lean();

    const progressMap = {};
    progressRecords.forEach((p) => {
      progressMap[p.resource._id.toString()] = p;
    });

    // Calculate progress per subject
    const subjectProgress = await Promise.all(
      subjects.map(async (subj) => {
        const totalResources = await Resource.countDocuments({
          subject: subj._id,
          status: 'approved',
        });

        const subjectProgressItems = progressRecords.filter(
          (p) => p.subject && p.subject.toString() === subj._id.toString()
        );

        const studiedCount = subjectProgressItems.filter((p) => p.status === 'Studied').length;
        const inProgressCount = subjectProgressItems.filter((p) => p.status === 'In Progress').length;
        const percentage = totalResources > 0 ? Math.round((studiedCount / totalResources) * 100) : 0;

        return {
          subject: {
            _id: subj._id,
            name: subj.name,
            code: subj.code,
            slug: subj.slug,
          },
          totalResources,
          studiedCount,
          inProgressCount,
          percentage,
        };
      })
    );

    res.json({
      success: true,
      subjectProgress,
      recentActivity: progressRecords.slice(0, 10),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/progress/status/:resourceId
router.get('/status/:resourceId', async (req, res, next) => {
  try {
    const resource = await findResourceByIdOrSlug(req.params.resourceId);
    if (!resource) {
      return res.json({
        success: true,
        status: 'Not Started',
        completionPercentage: 0,
      });
    }

    const record = await StudyProgress.findOne({
      user: req.user._id,
      resource: resource._id,
    });

    res.json({
      success: true,
      status: record ? record.status : 'Not Started',
      completionPercentage: record ? record.completionPercentage : 0,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/progress/update - update status for resource
router.post('/update', async (req, res, next) => {
  try {
    const { resourceId, status, lastViewedPage, completionPercentage } = req.body;
    if (!resourceId) {
      return res.status(400).json({ success: false, message: 'Resource ID is required' });
    }

    const resource = await findResourceByIdOrSlug(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const validStatuses = ['Not Started', 'In Progress', 'Studied'];
    const newStatus = validStatuses.includes(status) ? status : 'In Progress';

    const record = await StudyProgress.findOneAndUpdate(
      { user: req.user._id, resource: resource._id },
      {
        $set: {
          subject: resource.subject,
          status: newStatus,
          lastViewedPage: lastViewedPage || 1,
          completionPercentage: newStatus === 'Studied' ? 100 : completionPercentage || 50,
          lastStudiedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: `Progress updated to ${newStatus}`,
      record,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
