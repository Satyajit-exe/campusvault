import express from 'express';
import { CopyrightReport } from '../models/CopyrightReport.js';
import { Resource } from '../models/Resource.js';
import { findResourceByIdOrSlug } from '../utils/resourceHelper.js';

const router = express.Router();

// POST /api/copyright/report - submit copyright concern
router.post('/report', async (req, res, next) => {
  try {
    const { resourceId, reporterName, reporterEmail, concernType, details, evidenceUrl } = req.body;

    if (!resourceId || !reporterName || !reporterEmail || !details) {
      return res.status(400).json({
        success: false,
        message: 'Resource ID, your name, email, and details are required.',
      });
    }

    const resource = await findResourceByIdOrSlug(resourceId);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found.' });
    }

    const report = await CopyrightReport.create({
      resource: resource._id,
      reporterName: reporterName.trim(),
      reporterEmail: reporterEmail.trim(),
      concernType: concernType || 'Copyright Infringement',
      details: details.trim(),
      evidenceUrl: (evidenceUrl || '').trim(),
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Copyright report received. Our moderation team will investigate promptly.',
      reportId: report._id,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
