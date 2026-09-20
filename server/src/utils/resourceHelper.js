import mongoose from 'mongoose';
import { Resource } from '../models/Resource.js';

export async function findResourceByIdOrSlug(identifier) {
  if (!identifier) return null;
  const trimmed = identifier.toString().trim();
  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const byId = await Resource.findById(trimmed);
    if (byId) return byId;
  }
  return Resource.findOne({ slug: trimmed.toLowerCase() });
}

export async function findResourcePopulated(identifier) {
  if (!identifier) return null;
  const trimmed = identifier.toString().trim();
  const populateFields = [
    { path: 'subject', select: 'name code slug credits semesterNumber' },
    { path: 'college', select: 'name code slug' },
    { path: 'branch', select: 'name code' },
    { path: 'module', select: 'moduleNumber title' },
    { path: 'uploadedBy', select: 'fullName email' },
  ];

  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const byId = await Resource.findById(trimmed).populate(populateFields).lean();
    if (byId) return byId;
  }
  return Resource.findOne({ slug: trimmed.toLowerCase() }).populate(populateFields).lean();
}
