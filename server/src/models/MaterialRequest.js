import mongoose from 'mongoose';

const materialRequestSchema = new mongoose.Schema(
  {
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required'],
    },
    subjectName: {
      type: String,
      default: '',
    },
    requestedMaterial: {
      type: String,
      required: [true, 'Requested material title is required'],
      trim: true,
      maxlength: [200, 'Material title cannot exceed 200 characters'],
    },
    details: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Details cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'fulfilled', 'rejected', 'cancelled'],
      default: 'pending',
    },
    requestedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    requestCount: {
      type: Number,
      default: 1,
    },
    fulfilledResource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      default: null,
    },
  },
  { timestamps: true }
);

materialRequestSchema.index({ subject: 1, status: 1 });
materialRequestSchema.index({ requestCount: -1 });

export const MaterialRequest = mongoose.model('MaterialRequest', materialRequestSchema);
