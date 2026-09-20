import { Resource } from '../../models/Resource.js';
import { Subject } from '../../models/Subject.js';

class MongoSearchProvider {
  /**
   * Performs compound search with text and filter support, returning grouped results.
   */
  async search({ query, filters = {}, limit = 40, skip = 0 }) {
    const q = (query || '').trim();
    const mongoFilter = { status: 'approved' };

    // Apply structured filters
    if (filters.college) mongoFilter.college = filters.college;
    if (filters.course) mongoFilter.course = filters.course;
    if (filters.branch) mongoFilter.branch = filters.branch;
    if (filters.semesterNumber) mongoFilter.semesterNumber = Number(filters.semesterNumber);
    if (filters.subject) mongoFilter.subject = filters.subject;
    if (filters.materialType) mongoFilter.materialType = filters.materialType;
    if (filters.examType && filters.examType !== 'All') mongoFilter.examType = filters.examType;
    if (filters.examYear) mongoFilter.examYear = Number(filters.examYear);

    // If text query provided, also check if query matches a subject name/code first
    let matchingSubjectIds = [];
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const matchedSubjects = await Subject.find({
        $or: [{ name: regex }, { code: regex }, { slug: regex }],
      })
        .select('_id name code slug')
        .lean();

      matchingSubjectIds = matchedSubjects.map((s) => s._id);

      mongoFilter.$or = [
        { title: regex },
        { description: regex },
        { topicsCovered: { $in: [regex] } },
        { subject: { $in: matchingSubjectIds } },
      ];
    }

    const resources = await Resource.find(mongoFilter)
      .populate('subject', 'name code slug')
      .populate('college', 'name code')
      .populate('branch', 'name code')
      .sort({ trendingScore: -1, viewsCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Resource.countDocuments(mongoFilter);

    // Group results logically for the student UI
    const grouped = {
      questionPapers: [],
      notes: [],
      importantQuestions: [],
      caseStudies: [],
      assignmentsAndLabs: [],
      other: [],
    };

    resources.forEach((item) => {
      // Ensure fileKey or storage credentials are not exposed
      delete item.fileKey;
      delete item.uniqueViewers;

      switch (item.materialType) {
        case 'Question Paper':
        case 'Question Bank':
          grouped.questionPapers.push(item);
          break;
        case 'Notes':
        case 'Module Notes':
          grouped.notes.push(item);
          break;
        case 'Important Questions':
        case 'Viva Questions':
          grouped.importantQuestions.push(item);
          break;
        case 'Case Study':
          grouped.caseStudies.push(item);
          break;
        case 'Assignment':
        case 'Lab Manual':
          grouped.assignmentsAndLabs.push(item);
          break;
        default:
          grouped.other.push(item);
          break;
      }
    });

    return {
      query: q,
      totalCount,
      grouped,
      allResults: resources,
    };
  }
}

class SearchService {
  constructor() {
    this.provider = new MongoSearchProvider();
  }

  async search(params) {
    return this.provider.search(params);
  }
}

export const searchService = new SearchService();
