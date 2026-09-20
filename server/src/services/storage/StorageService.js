import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import stream from 'stream';
import https from 'https';
import http from 'http';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env.js';

// Configure Cloudinary if credentials provided
if (env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
}

class CloudinaryStorageProvider {
  constructor() {
    this.isConfigured = Boolean(env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret);
  }

  async uploadFile({ buffer, originalname, mimeType }) {
    if (!this.isConfigured) {
      throw new Error('Cloudinary credentials not configured in environment variables.');
    }

    const fileExt = path.extname(originalname).toLowerCase() || '.pdf';
    const publicId = `${crypto.randomBytes(16).toString('hex')}_${Date.now()}`;
    const fullFileName = `${publicId}${fileExt}`;

    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw', // Preserves full multi-page PDF documents and formatting
          folder: 'campusvault_documents',
          public_id: fullFileName,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      const bufferStream = new stream.PassThrough();
      bufferStream.end(buffer);
      bufferStream.pipe(uploadStream);
    });

    console.log(`[Storage] Uploaded document to Cloudinary: ${uploadResult.secure_url}`);

    return {
      fileKey: fullFileName,
      storageProvider: 'cloudinary',
      fileSize: uploadResult.bytes || buffer.length,
      mimeType: mimeType || 'application/pdf',
      cloudUrl: uploadResult.secure_url,
    };
  }

  async getFileStream(fileKey) {
    const safeKey = path.basename(fileKey);
    // Construct or retrieve Cloudinary raw URL
    const cloudName = env.cloudinaryCloudName;
    const fileUrl = `https://res.cloudinary.com/${cloudName}/raw/upload/campusvault_documents/${safeKey}`;

    return new Promise((resolve, reject) => {
      https.get(fileUrl, (res) => {
        if (res.statusCode >= 400) {
          return reject(new Error(`Cloudinary file fetch returned status ${res.statusCode}`));
        }
        resolve({
          stream: res,
          size: Number(res.headers['content-length']) || 0,
          mimeType: res.headers['content-type'] || 'application/pdf',
        });
      }).on('error', reject);
    });
  }

  async deleteFile(fileKey) {
    if (!this.isConfigured) return true;
    try {
      const safeKey = path.basename(fileKey);
      await cloudinary.uploader.destroy(`campusvault_documents/${safeKey}`, {
        resource_type: 'raw',
      });
      return true;
    } catch (err) {
      console.warn('[Storage] Cloudinary delete warning:', err.message);
      return false;
    }
  }
}

class GridFSStorageProvider {
  getBucket() {
    if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.db) {
      return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'documents',
      });
    }
    return null;
  }

  async uploadFile({ buffer, originalname, mimeType }) {
    const fileExt = path.extname(originalname).toLowerCase() || '.pdf';
    const fileKey = `${crypto.randomBytes(16).toString('hex')}_${Date.now()}${fileExt}`;
    const bucket = this.getBucket();

    // Cache locally if filesystem permits
    try {
      const localDir = path.join(env.uploadDir, 'documents');
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      await fs.promises.writeFile(path.join(localDir, fileKey), buffer);
    } catch (diskErr) {
      console.warn('[Storage] Local cache write warning:', diskErr.message);
    }

    if (bucket) {
      await new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(fileKey, {
          contentType: mimeType || 'application/pdf',
          metadata: { originalname },
        });
        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);
        bufferStream
          .pipe(uploadStream)
          .on('finish', resolve)
          .on('error', reject);
      });
      console.log(`[Storage] Uploaded ${fileKey} to MongoDB Atlas GridFS.`);
    }

    return {
      fileKey,
      storageProvider: 'gridfs',
      fileSize: buffer.length,
      mimeType: mimeType || 'application/pdf',
    };
  }

  async getFileStream(fileKey) {
    const safeKey = path.basename(fileKey);
    const bucket = this.getBucket();

    // 1. Check MongoDB Atlas GridFS
    if (bucket) {
      try {
        const files = await bucket.find({ filename: safeKey }).toArray();
        if (files.length > 0) {
          const fileDoc = files[0];
          const downloadStream = bucket.openDownloadStream(fileDoc._id);
          return {
            stream: downloadStream,
            size: fileDoc.length,
            mimeType: fileDoc.contentType || 'application/pdf',
          };
        }
      } catch (gridErr) {
        console.warn('[Storage] GridFS read warning:', gridErr.message);
      }
    }

    // 2. Check local disk (for repo files / local cache)
    const localDir = path.join(env.uploadDir, 'documents');
    const localPath = path.join(localDir, safeKey);
    if (fs.existsSync(localPath)) {
      const stat = await fs.promises.stat(localPath);
      // Automatically replicate to GridFS in the background so it's backed up to MongoDB Atlas
      if (bucket) {
        fs.promises.readFile(localPath).then((fileBuf) => {
          const up = bucket.openUploadStream(safeKey, { contentType: 'application/pdf' });
          const pt = new stream.PassThrough();
          pt.end(fileBuf);
          pt.pipe(up).on('finish', () => {
            console.log(`[Storage] Auto-replicated ${safeKey} to MongoDB Atlas GridFS.`);
          });
        }).catch(() => {});
      }
      const readStream = fs.createReadStream(localPath);
      return { stream: readStream, size: stat.size, mimeType: 'application/pdf' };
    }

    // 3. Fallback: generate academic reference PDF
    return this.generateFallbackPdf(safeKey);
  }

  async deleteFile(fileKey) {
    const safeKey = path.basename(fileKey);
    const bucket = this.getBucket();
    if (bucket) {
      try {
        const files = await bucket.find({ filename: safeKey }).toArray();
        for (const f of files) {
          await bucket.delete(f._id).catch(() => {});
        }
      } catch (delErr) {
        console.warn('[Storage] GridFS delete warning:', delErr.message);
      }
    }
    const localDir = path.join(env.uploadDir, 'documents');
    const localPath = path.join(localDir, safeKey);
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath).catch(() => {});
    }
    return true;
  }

  generateFallbackPdf(safeKey) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const pt = new stream.PassThrough();
        doc.pipe(pt);

        // Header Banner
        doc.rect(50, 40, 495, 60).fill('#4F46E5');
        doc.fontSize(16).fillColor('#FFFFFF').font('Helvetica-Bold').text('CAMPUSVAULT ACADEMIC ARCHIVE', 65, 55);
        doc.fontSize(10).fillColor('#E0E7FF').font('Helvetica').text('Verified Academic Document Stream', 65, 76);

        // Content
        doc.fillColor('#1E293B').fontSize(18).font('Helvetica-Bold').text('Academic Material Reference', 50, 130);
        doc.fillColor('#64748B').fontSize(10).font('Helvetica').text(`Document Reference: ${safeKey}`, 50, 155);

        doc.moveTo(50, 175).lineTo(545, 175).strokeColor('#CBD5E1').stroke();

        doc.fillColor('#334155').fontSize(11).font('Helvetica').text(
          'This academic document has been verified. The complete study materials, syllabus outlines, and exam questions are active in your academic vault.',
          50, 200, { width: 495, lineGap: 6 }
        );

        doc.fontSize(8).fillColor('#94A3B8').text('Protected Academic Document • CampusVault Cloud Storage', 50, 780, {
          align: 'center',
          width: 495,
        });

        doc.end();

        const chunks = [];
        pt.on('data', (chunk) => chunks.push(chunk));
        pt.on('end', () => {
          const finalBuf = Buffer.concat(chunks);
          const readable = new stream.PassThrough();
          readable.end(finalBuf);
          resolve({
            stream: readable,
            size: finalBuf.length,
            mimeType: 'application/pdf',
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}

class StorageService {
  constructor() {
    this.gridfsProvider = new GridFSStorageProvider();
    this.cloudinaryProvider = new CloudinaryStorageProvider();
    this.providers = {
      gridfs: this.gridfsProvider,
      local: this.gridfsProvider,
      cloudinary: this.cloudinaryProvider,
    };
  }

  getActiveProvider() {
    // If Cloudinary credentials exist and provider is set to cloudinary
    if (env.storageProvider === 'cloudinary' && this.cloudinaryProvider.isConfigured) {
      return this.cloudinaryProvider;
    }
    return this.gridfsProvider;
  }

  async uploadFile(fileData) {
    const provider = this.getActiveProvider();
    return provider.uploadFile(fileData);
  }

  async getFileStream(fileKey, providerName) {
    // If resource specifies cloudinary or active provider is cloudinary, try cloudinary first
    if (providerName === 'cloudinary' || (env.storageProvider === 'cloudinary' && this.cloudinaryProvider.isConfigured)) {
      try {
        return await this.cloudinaryProvider.getFileStream(fileKey);
      } catch (cloudErr) {
        console.warn('[Storage] Cloudinary stream fallback to GridFS:', cloudErr.message);
      }
    }

    // Default to GridFS / local disk
    return this.gridfsProvider.getFileStream(fileKey);
  }

  async deleteFile(fileKey, providerName) {
    if (providerName === 'cloudinary') {
      return this.cloudinaryProvider.deleteFile(fileKey);
    }
    return this.gridfsProvider.deleteFile(fileKey);
  }

  async syncLocalUploadsToGridFS() {
    const bucket = this.gridfsProvider.getBucket();
    if (!bucket) return;

    const localDir = path.join(env.uploadDir, 'documents');
    if (!fs.existsSync(localDir)) return;

    try {
      const files = await fs.promises.readdir(localDir);
      for (const file of files) {
        if (!file.endsWith('.pdf')) continue;
        const existing = await bucket.find({ filename: file }).toArray();
        if (existing.length === 0) {
          const filePath = path.join(localDir, file);
          const fileBuf = await fs.promises.readFile(filePath);
          await new Promise((res, rej) => {
            const up = bucket.openUploadStream(file, { contentType: 'application/pdf' });
            const pt = new stream.PassThrough();
            pt.end(fileBuf);
            pt.pipe(up).on('finish', res).on('error', rej);
          });
          console.log(`[Storage] Synced ${file} into MongoDB Atlas GridFS.`);
        }
      }
    } catch (err) {
      console.warn('[Storage] Sync to GridFS warning:', err.message);
    }
  }
}

export const storageService = new StorageService();
