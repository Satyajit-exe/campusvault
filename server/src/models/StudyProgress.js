import mongoose from 'mongoose';

const studyProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Studied'],
      default: 'Not Started',
    },
    lastViewedPage: {
      type: Number,
      default: 1,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastStudiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

studyProgressSchema.index({ user: 1, resource: 1 }, { unique: true });
studyProgressSchema.index({ user: 1, subject: 1 });

export const StudyProgress = mongoose.model('StudyProgress', studyProgressSchema);
