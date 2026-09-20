import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Course name is required (e.g. B.Tech, M.Tech, BCA)'],
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
    },
    durationYears: {
      type: Number,
      default: 4,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

courseSchema.index({ college: 1, code: 1 }, { unique: true });

export const Course = mongoose.model('Course', courseSchema);
