import mongoose from 'mongoose';

const semesterSchema = new mongoose.Schema(
  {
    semesterNumber: {
      type: Number,
      required: [true, 'Semester number is required (1-8)'],
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
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AcademicYear',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

semesterSchema.index({ branch: 1, semesterNumber: 1 }, { unique: true });

export const Semester = mongoose.model('Semester', semesterSchema);
