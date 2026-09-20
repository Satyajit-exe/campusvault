import express from 'express';
import { MaterialRequest } from '../models/MaterialRequest.js';
import { Subject } from '../models/Subject.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/requests - list active requests sorted by request count
router.get('/', async (req, res, next) => {
  try {
    const requests = await MaterialRequest.find({ status: 'pending' })
      .populate('subject', 'name code slug')
      .sort({ requestCount: -1, createdAt: -1 })
      .limit(30)
      .lean();

    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
});

// GET /api/requests/my - user's own requests
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const requests = await MaterialRequest.find({
      'requestedBy.user': req.user._id,
    })
      .populate('subject', 'name code slug')
      .populate('fulfilledResource', 'title slug')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
});

// POST /api/requests - submit a material request
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { subjectId, requestedMaterial, details } = req.body;

    if (!subjectId || !requestedMaterial) {
      return res.status(400).json({
        success: false,
        message: 'Subject and requested material title are required.',
      });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Check if a similar pending request exists for this subject to combine counts
    const cleanTitle = requestedMaterial.trim();
    let existing = await MaterialRequest.findOne({
      subject: subject._id,
      status: 'pending',
      requestedMaterial: { $regex: new RegExp(`^${cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });

    if (existing) {
      // Check if this student already requested it
      const alreadyRequested = existing.requestedBy.some(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (!alreadyRequested) {
        existing.requestedBy.push({ user: req.user._id });
        existing.requestCount = existing.requestedBy.length;
        await existing.save();
      }

      return res.json({
        success: true,
        message: 'Your vote has been added to this existing request!',
        request: existing,
      });
    }

    // Create new request
    const newRequest = await MaterialRequest.create({
      subject: subject._id,
      subjectName: `${subject.name} (${subject.code})`,
      requestedMaterial: cleanTitle,
      details: details || '',
      requestedBy: [{ user: req.user._id }],
      requestCount: 1,
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Material request submitted successfully!',
      request: newRequest,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/requests/:id - cancel user's own request
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const request = await MaterialRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Remove user from requestedBy
    const initialLen = request.requestedBy.length;
    request.requestedBy = request.requestedBy.filter(
      (r) => r.user.toString() !== req.user._id.toString()
    );

    if (request.requestedBy.length === 0) {
      // If no other students requested it, mark cancelled
      request.status = 'cancelled';
    } else {
      request.requestCount = request.requestedBy.length;
    }

    await request.save();

    res.json({
      success: true,
      message: 'Request withdrawn successfully.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
