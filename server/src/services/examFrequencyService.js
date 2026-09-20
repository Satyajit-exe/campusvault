import { Resource } from '../models/Resource.js';
import { Subject } from '../models/Subject.js';

export async function getExamModeData(subjectSlug) {
  const subject = await Subject.findOne({ slug: subjectSlug.toLowerCase() })
    .populate('college', 'name code')
    .populate('branch', 'name code');

  if (!subject) {
    throw new Error('Subject not found');
  }

  // Fetch all approved exam resources (PYQs and Question Banks)
  const examResources = await Resource.find({
    subject: subject._id,
    status: 'approved',
    materialType: { $in: ['Question Paper', 'Question Bank', 'Important Questions'] },
  })
    .sort({ examYear: -1 })
    .lean();

  // Find min and max years present
  let minYear = 2022;
  let maxYear = 2026;
  if (examResources.length > 0) {
    const years = examResources.map((r) => r.examYear).filter(Boolean);
    if (years.length > 0) {
      minYear = Math.min(...years);
      maxYear = Math.max(...years);
    }
  }

  // Aggregate topic frequencies
  const topicCounts = {};
  const totalPapers = examResources.length;

  examResources.forEach((resource) => {
    const topics = resource.topicsCovered || [];
    const uniqueTopicsInPaper = new Set(topics.map((t) => t.trim()));

    uniqueTopicsInPaper.forEach((topic) => {
      if (!topic) return;
      if (!topicCounts[topic]) {
        topicCounts[topic] = {
          topic,
          count: 0,
          years: new Set(),
          examTypes: new Set(),
        };
      }
      topicCounts[topic].count += 1;
      if (resource.examYear) topicCounts[topic].years.add(resource.examYear);
      if (resource.examType) topicCounts[topic].examTypes.add(resource.examType);
    });
  });

  const frequentTopics = Object.values(topicCounts)
    .map((item) => ({
      topic: item.topic,
      frequencyCount: item.count,
      percentageOfPapers: totalPapers > 0 ? Math.round((item.count / totalPapers) * 100) : 0,
      yearsAppeared: Array.from(item.years).sort((a, b) => b - a),
      examTypes: Array.from(item.examTypes),
    }))
    .sort((a, b) => b.frequencyCount - a.frequencyCount)
    .slice(0, 10); // top 10

  // Quick notes
  const quickNotes = await Resource.find({
    subject: subject._id,
    status: 'approved',
    materialType: 'Notes',
  })
    .select('title slug description fileSize viewsCount savesCount')
    .sort({ trendingScore: -1, viewsCount: -1 })
    .limit(6)
    .lean();

  return {
    subject: {
      _id: subject._id,
      name: subject.name,
      code: subject.code,
      slug: subject.slug,
      semesterNumber: subject.semesterNumber,
      college: subject.college,
      branch: subject.branch,
    },
    meta: {
      totalPapersIndexed: totalPapers,
      yearRange: `${minYear}–${maxYear}`,
      disclaimer: `Based on indexed CampusVault resources from ${minYear}–${maxYear}. Topics reflect historical frequency across archived exam materials and do not guarantee future question appearance.`,
    },
    frequentTopics,
    pyqList: examResources.map((r) => {
      delete r.fileKey;
      delete r.uniqueViewers;
      return r;
    }),
    quickNotes,
  };
}
