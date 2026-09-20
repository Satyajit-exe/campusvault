import express from 'express';
import { Subject } from '../models/Subject.js';
import { Module } from '../models/Module.js';
import { Resource } from '../models/Resource.js';
import { getExamModeData } from '../services/examFrequencyService.js';

const router = express.Router();

// GET /api/subjects - list subjects (e.g. for student semester)
router.get('/', async (req, res, next) => {
  try {
    const query = { isActive: true };
    if (req.query.branch) query.branch = req.query.branch;
    if (req.query.semester) query.semesterNumber = Number(req.query.semester);

    const subjects = await Subject.find(query)
      .populate('branch', 'name code')
      .populate('course', 'name code')
      .sort({ semesterNumber: 1, name: 1 })
      .lean();

    res.json({ success: true, subjects });
  } catch (error) {
    next(error);
  }
});

// GET /api/subjects/:slug - detailed subject page
router.get('/:slug', async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ slug: req.query.slug || req.params.slug.toLowerCase() })
      .populate('branch', 'name code')
      .populate('course', 'name code')
      .populate('college', 'name code slug')
      .lean();

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const [modules, resources] = await Promise.all([
      Module.find({ subject: subject._id }).sort({ moduleNumber: 1 }).lean(),
      Resource.find({ subject: subject._id, status: 'approved' })
        .populate('module', 'moduleNumber title')
        .sort({ trendingScore: -1, viewsCount: -1, createdAt: -1 })
        .lean(),
    ]);

    // Categorize resources for subject tabs and sections
    const pyqs = [];
    const notes = [];
    const questionBanks = [];
    const caseStudies = [];
    const assignments = [];
    const labManuals = [];
    const importantQuestions = [];

    resources.forEach((r) => {
      delete r.fileKey;
      delete r.uniqueViewers;

      switch (r.materialType) {
        case 'Question Paper':
          pyqs.push(r);
          break;
        case 'Notes':
          notes.push(r);
          break;
        case 'Question Bank':
          questionBanks.push(r);
          break;
        case 'Case Study':
          caseStudies.push(r);
          break;
        case 'Assignment':
          assignments.push(r);
          break;
        case 'Lab Manual':
          labManuals.push(r);
          break;
        case 'Important Questions':
        case 'Viva Questions':
          importantQuestions.push(r);
          break;
        default:
          notes.push(r);
          break;
      }
    });

    const mostUseful = [...resources].sort((a, b) => b.viewsCount + b.savesCount * 2 - (a.viewsCount + a.savesCount * 2)).slice(0, 6);
    const recentlyAdded = [...resources].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

    res.json({
      success: true,
      subject: {
        ...subject,
        resourceCount: resources.length,
      },
      modules,
      categories: {
        all: resources,
        pyqs,
        notes,
        questionBanks,
        caseStudies,
        assignments,
        labManuals,
        importantQuestions,
      },
      sections: {
        mostUseful,
        recentlyAdded,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/subjects/:slug/pyqs - PYQ page grouped by year & exam type
router.get('/:slug/pyqs', async (req, res, next) => {
  try {
    const subject = await Subject.findOne({ slug: req.params.slug.toLowerCase() })
      .populate('branch', 'name code')
      .populate('college', 'name code')
      .lean();

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const pyqs = await Resource.find({
      subject: subject._id,
      status: 'approved',
      materialType: 'Question Paper',
    })
      .sort({ examYear: -1, examType: 1 })
      .lean();

    // Group PYQs by year
    const groupedByYear = {};
    pyqs.forEach((item) => {
      delete item.fileKey;
      delete item.uniqueViewers;

      const year = item.examYear || 'Unknown Year';
      if (!groupedByYear[year]) {
        groupedByYear[year] = {
          year,
          midSem: [],
          endSem: [],
          internal: [],
          other: [],
          all: [],
        };
      }
      groupedByYear[year].all.push(item);

      if (item.examType === 'Mid-Sem') groupedByYear[year].midSem.push(item);
      else if (item.examType === 'End-Sem') groupedByYear[year].endSem.push(item);
      else if (item.examType === 'Internal') groupedByYear[year].internal.push(item);
      else groupedByYear[year].other.push(item);
    });

    const yearsList = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a));

    res.json({
      success: true,
      subject,
      totalPyqs: pyqs.length,
      yearsList,
      groupedByYear,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/subjects/:slug/exam-mode - Exam Mode data
router.get('/:slug/exam-mode', async (req, res, next) => {
  try {
    const data = await getExamModeData(req.params.slug);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
