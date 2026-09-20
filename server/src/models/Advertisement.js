import mongoose from 'mongoose';

const advertisementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slot: {
      type: String,
      enum: ['banner_top', 'sidebar', 'viewer_bottom', 'search_inline'],
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    targetUrl: {
      type: String,
      required: true,
    },
    sponsorName: {
      type: String,
      default: '',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    clicksCount: {
      type: Number,
      default: 0,
    },
    impressionsCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Advertisement = mongoose.model('Advertisement', advertisementSchema);
