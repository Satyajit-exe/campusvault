import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
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
    folder: {
      type: String,
      default: 'General',
      trim: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate bookmarks for the same user & resource
bookmarkSchema.index({ user: 1, resource: 1 }, { unique: true });

export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
