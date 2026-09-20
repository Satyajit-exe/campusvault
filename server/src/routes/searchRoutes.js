import express from 'express';
import { searchService } from '../services/search/SearchService.js';
import { Subject } from '../models/Subject.js';
import { Resource } from '../models/Resource.js';

const router = express.Router();

// GET /api/search
router.get('/', async (req, res, next) => {
  try {
    const {
      q = '',
      college,
      course,
      branch,
      semester,
      subject,
      materialType,
      examType,
      year,
      limit = 40,
      page = 1,
    } = req.query;

    const filters = {};
    if (college) filters.college = college;
    if (course) filters.course = course;
    if (branch) filters.branch = branch;
    if (semester) filters.semesterNumber = Number(semester);
    if (subject) filters.subject = subject;
    if (materialType) filters.materialType = materialType;
    if (examType) filters.examType = examType;
    if (year) filters.examYear = Number(year);

    const skip = (Number(page) - 1) * Number(limit);

    const results = await searchService.search({
      query: q,
      filters,
      limit: Number(limit),
      skip,
    });

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/search/suggestions - quick suggestions for search box
router.get('/suggestions', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({
        success: true,
        popular: ['DBMS Mid-Sem 2025', 'DSA Notes', 'Computer Networks PYQ', 'Operating Systems', 'Discrete Mathematics'],
        suggestions: [],
      });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [subjects, resources] = await Promise.all([
      Subject.find({ $or: [{ name: regex }, { code: regex }] })
        .select('name code slug')
        .limit(4)
        .lean(),
      Resource.find({ title: regex, status: 'approved' })
        .select('title slug materialType examYear')
        .limit(6)
        .lean(),
    ]);

    res.json({
      success: true,
      suggestions: {
        subjects,
        resources,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
