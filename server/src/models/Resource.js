import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    // Storage references (internal only - NEVER exposed to students!)
    fileKey: {
      type: String,
      required: true,
    },
    storageProvider: {
      type: String,
      enum: ['local', 's3', 'r2', 'cloudinary'],
      default: 'local',
    },
    fileSize: {
      type: Number, // in bytes
      required: true,
    },
    pageCount: {
      type: Number,
      default: 1,
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },

    // Academic Classification
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    academicYear: {
      type: String, // e.g. "2025-26"
      required: true,
    },
    semesterNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      default: null,
    },

    // Material Classification
    materialType: {
      type: String,
      enum: [
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
      required: true,
    },
    examType: {
      type: String,
      enum: [
        'Mid-Sem',
        'End-Sem',
        'Internal',
        'Practical',
        'Back Exam',
        'Improvement',
        'None',
        'Other',
      ],
      default: 'None',
    },
    examYear: {
      type: Number,
      default: new Date().getFullYear(),
    },
    topicsCovered: [
      {
        type: String,
        trim: true,
      },
    ],

    // Content Rights & Moderation
    source: {
      type: String,
      default: 'Student Contribution',
      trim: true,
    },
    sourceType: {
      type: String,
      enum: [
        'Official',
        'Admin-created',
        'Student-created',
        'Public/Openly Licensed',
        'Shared With Permission',
        'Other',
      ],
      default: 'Student-created',
    },
    permissionStatus: {
      type: String,
      enum: [
        'Pending',
        'Permitted',
        'Publicly Licensed',
        'Official',
        'Restricted',
        'Rejected',
      ],
      default: 'Pending',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'archived'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },

    // Engagement Metrics
    viewsCount: {
      type: Number,
      default: 0,
    },
    uniqueViewsCount: {
      type: Number,
      default: 0,
    },
    uniqueViewers: [
      {
        type: String,
      },
    ],
    savesCount: {
      type: Number,
      default: 0,
    },
    trendingScore: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for high performance discovery
resourceSchema.index({ status: 1, subject: 1, materialType: 1 });
resourceSchema.index({ status: 1, trendingScore: -1 });
resourceSchema.index({ status: 1, viewsCount: -1 });
resourceSchema.index({ status: 1, createdAt: -1 });
resourceSchema.index({
  title: 'text',
  description: 'text',
  topicsCovered: 'text',
});

// Calculate trending score dynamically:
// score = (views * 1) + (saves * 3) + freshness_decay
resourceSchema.methods.calculateTrendingScore = function () {
  const ageInHours = (Date.now() - new Date(this.createdAt).getTime()) / (1000 * 60 * 60);
  const score = (this.viewsCount * 1 + this.savesCount * 3) / Math.pow(ageInHours + 2, 0.8);
  this.trendingScore = Math.round(score * 100) / 100;
  return this.trendingScore;
};

export const Resource = mongoose.model('Resource', resourceSchema);
