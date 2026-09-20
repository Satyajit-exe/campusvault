import multer from 'multer';
import path from 'path';
import { env } from '../config/env.js';

// Memory storage so we can validate magic bytes before committing to disk/cloud
const memoryStorage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.pdf') {
    return cb(new Error('Only PDF files (.pdf) are allowed on CampusVault.'), false);
  }

  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Invalid MIME type. File must be application/pdf.'), false);
  }

  cb(null, true);
};

export const uploadPdf = multer({
  storage: memoryStorage,
  limits: {
    fileSize: env.maxFileSizeMb * 1024 * 1024, // e.g. 25MB
    files: 1,
  },
  fileFilter,
});

/**
 * Validates file signature (magic bytes) to verify it is genuine PDF:
 * A valid PDF must start with '%PDF-' (0x25 0x50 0x44 0x46)
 */
export function validatePdfMagicBytes(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded. Please attach a PDF document.',
    });
  }

  const buffer = req.file.buffer;
  if (!buffer || buffer.length < 5) {
    return res.status(400).json({
      success: false,
      message: 'Uploaded file is corrupted or empty.',
    });
  }

  // Check first 5 bytes: %PDF-
  const header = buffer.slice(0, 5).toString('ascii');
  if (header !== '%PDF-') {
    return res.status(400).json({
      success: false,
      message: 'Security validation failed: File does not match valid PDF signature (%PDF-).',
    });
  }

  // Scan for malicious script payloads inside PDF object streams if possible
  const contentSnippet = buffer.slice(0, 2048).toString('latin1');
  if (
    contentSnippet.includes('<script') ||
    contentSnippet.includes('<?php') ||
    contentSnippet.includes('MZ') // Windows PE executable header
  ) {
    return res.status(400).json({
      success: false,
      message: 'Security validation failed: Suspicious content detected in document header.',
    });
  }

  next();
}
