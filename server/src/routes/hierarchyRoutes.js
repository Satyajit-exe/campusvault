import express from 'express';
import { College } from '../models/College.js';
import { Course } from '../models/Course.js';
import { Branch } from '../models/Branch.js';
import { Subject } from '../models/Subject.js';
import { AcademicYear } from '../models/AcademicYear.js';

const router = express.Router();

// GET /api/hierarchy/colleges
router.get('/colleges', async (req, res, next) => {
  try {
    const colleges = await College.find({ isActive: true }).sort({ name: 1 }).lean();
    res.json({ success: true, colleges });
  } catch (error) {
    next(error);
  }
});

// GET /api/hierarchy/courses?college=id
router.get('/courses', async (req, res, next) => {
  try {
    const query = { isActive: true };
    if (req.query.college) query.college = req.query.college;
    const courses = await Course.find(query).sort({ name: 1 }).lean();
    res.json({ success: true, courses });
  } catch (error) {
    next(error);
  }
});

// GET /api/hierarchy/branches?course=id
router.get('/branches', async (req, res, next) => {
  try {
    const query = { isActive: true };
    if (req.query.course) query.course = req.query.course;
    if (req.query.college) query.college = req.query.college;
    const branches = await Branch.find(query).sort({ name: 1 }).lean();
    res.json({ success: true, branches });
  } catch (error) {
    next(error);
  }
});

// GET /api/hierarchy/academic-years
router.get('/academic-years', async (req, res, next) => {
  try {
    const years = await AcademicYear.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, academicYears: years });
  } catch (error) {
    next(error);
  }
});

// GET /api/hierarchy/filter-options
router.get('/filter-options', async (req, res, next) => {
  try {
    const [colleges, courses, branches, academicYears, subjects] = await Promise.all([
      College.find({ isActive: true }).select('name code slug').lean(),
      Course.find({ isActive: true }).select('name code college').lean(),
      Branch.find({ isActive: true }).select('name code course college').lean(),
      AcademicYear.find().select('name isCurrent').sort({ name: -1 }).lean(),
      Subject.find({ isActive: true }).select('name code slug semesterNumber branch').lean(),
    ]);

    res.json({
      success: true,
      data: {
        colleges,
        courses,
        branches,
        academicYears,
        subjects,
        semesters: [1, 2, 3, 4, 5, 6, 7, 8],
        materialTypes: [
          'Question Paper',
          'Notes',
          'Question Bank',
          'Case Study',
          'Assignment',
          'Lab Manual',
          'Syllabus',
          'Important Questions',
          'Viva Questions',
          'Other',
        ],
        examTypes: ['Mid-Sem', 'End-Sem', 'Internal', 'Practical', 'Back Exam', 'Improvement', 'Other'],
        years: [2026, 2025, 2024, 2023, 2022, 2021],
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
