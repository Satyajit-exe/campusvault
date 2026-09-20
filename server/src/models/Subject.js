import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Subject code is required (e.g. CSE302)'],
      trim: true,
      uppercase: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    semesterNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
    },
    credits: {
      type: Number,
      default: 4,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String,
      default: 'BookOpen',
    },
    resourceCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index for uniqueness within branch
subjectSchema.index({ branch: 1, code: 1 }, { unique: true });
subjectSchema.index({ slug: 1 });
subjectSchema.index({ name: 'text', code: 'text', description: 'text' });

export const Subject = mongoose.model('Subject', subjectSchema);
