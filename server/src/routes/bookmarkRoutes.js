import express from 'express';
import { Bookmark } from '../models/Bookmark.js';
import { Resource } from '../models/Resource.js';
import { authenticate } from '../middleware/auth.js';
import { findResourceByIdOrSlug } from '../utils/resourceHelper.js';

const router = express.Router();

// All bookmark routes require authentication
router.use(authenticate);

// GET /api/bookmarks - list user bookmarks
router.get('/', async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate({
        path: 'resource',
        populate: [
          { path: 'subject', select: 'name code slug' },
          { path: 'branch', select: 'name code' },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    // Filter out deleted/archived resources
    const validBookmarks = bookmarks.filter((b) => b.resource && b.resource.status === 'approved');

    res.json({
      success: true,
      bookmarks: validBookmarks,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookmarks/check/:resourceId
router.get('/check/:resourceId', async (req, res, next) => {
  try {
    const resource = await findResourceByIdOrSlug(req.params.resourceId);
    if (!resource) {
      return res.json({ success: true, isBookmarked: false });
    }

    const exists = await Bookmark.findOne({
      user: req.user._id,
      resource: resource._id,
    });
    res.json({ success: true, isBookmarked: !!exists });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookmarks/:resourceId - toggle or add bookmark
router.post('/:resourceId', async (req, res, next) => {
  try {
    const resource = await findResourceByIdOrSlug(req.params.resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    const existing = await Bookmark.findOne({
      user: req.user._id,
      resource: resource._id,
    });

    if (existing) {
      // Remove bookmark
      await Bookmark.findByIdAndDelete(existing._id);
      resource.savesCount = Math.max(0, (resource.savesCount || 1) - 1);
      resource.calculateTrendingScore();
      await resource.save();

      return res.json({
        success: true,
        isBookmarked: false,
        message: 'Removed from bookmarks',
      });
    }

    // Add bookmark
    await Bookmark.create({
      user: req.user._id,
      resource: resource._id,
      folder: req.body.folder || 'General',
    });

    resource.savesCount = (resource.savesCount || 0) + 1;
    resource.calculateTrendingScore();
    await resource.save();

    res.json({
      success: true,
      isBookmarked: true,
      message: 'Saved to bookmarks!',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
