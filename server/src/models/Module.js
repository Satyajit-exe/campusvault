import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema(
  {
    moduleNumber: {
      type: Number,
      required: [true, 'Module number is required'],
      min: 1,
      max: 20,
    },
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    topics: [
      {
        type: String,
        trim: true,
      },
    ],
    resourceCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

moduleSchema.index({ subject: 1, moduleNumber: 1 }, { unique: true });

export const Module = mongoose.model('Module', moduleSchema);
