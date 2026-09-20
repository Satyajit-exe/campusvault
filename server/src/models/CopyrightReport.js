import mongoose from 'mongoose';

const copyrightReportSchema = new mongoose.Schema(
  {
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
    reporterName: {
      type: String,
      required: [true, 'Your name is required'],
      trim: true,
    },
    reporterEmail: {
      type: String,
      required: [true, 'Your email is required'],
      trim: true,
    },
    concernType: {
      type: String,
      enum: [
        'Copyright Infringement',
        'Paid Textbook / Course Content',
        'Restricted Faculty Document',
        'Private Student Notes Without Consent',
        'Incorrect / Inaccurate Material',
        'Other',
      ],
      default: 'Copyright Infringement',
    },
    details: {
      type: String,
      required: [true, 'Details are required'],
      trim: true,
      maxlength: [2000, 'Details cannot exceed 2000 characters'],
    },
    evidenceUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'investigating', 'action_taken', 'dismissed'],
      default: 'pending',
    },
    actionTaken: {
      type: String,
      enum: ['None', 'Resource Unpublished', 'Resource Archived', 'Resource Deleted', 'Report Dismissed'],
      default: 'None',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

copyrightReportSchema.index({ status: 1 });
copyrightReportSchema.index({ resource: 1 });

export const CopyrightReport = mongoose.model('CopyrightReport', copyrightReportSchema);
