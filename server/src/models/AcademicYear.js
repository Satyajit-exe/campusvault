import mongoose from 'mongoose';

const academicYearSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Academic year name is required (e.g. 2025-26)'],
      trim: true,
      unique: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    isCurrent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const AcademicYear = mongoose.model('AcademicYear', academicYearSchema);
