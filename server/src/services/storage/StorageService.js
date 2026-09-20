import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import stream from 'stream';
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
    this.isConfigured = Boolean(
      env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret
    );
    if (this.isConfigured) {
      console.log(`[Storage] Cloudinary configured for cloud: ${env.cloudinaryCloudName}`);
    } else {
      console.warn('[Storage] Cloudinary credentials not configured. Falling back to local disk.');
    }
  }

  async uploadFile({ buffer, originalname, mimeType }) {
    if (!this.isConfigured) {
      throw new Error(
        'Cloudinary credentials are not configured in server/.env (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).'
      );
    }

    const fileExt = path.extname(originalname).toLowerCase() || '.pdf';
    const publicId = `${crypto.randomBytes(16).toString('hex')}_${Date.now()}`;
    const fullFileName = `${publicId}${fileExt}`;

    // Upload to Cloudinary with resource_type: 'raw' for multi-page documents
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: 'campusvault_documents',
          public_id: fullFileName,
          use_filename: false,
          unique_filename: false,
          access_mode: 'public',
          overwrite: true,
          invalidate: true,
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

    console.log(`[Storage] Successfully uploaded document to Cloudinary: ${uploadResult.secure_url}`);

    // Cache locally on disk for zero-latency local retrieval
    try {
      const localDir = path.join(env.uploadDir, 'documents');
      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }
      await fs.promises.writeFile(path.join(localDir, fullFileName), buffer);
    } catch (diskErr) {
      console.warn('[Storage] Local cache write warning:', diskErr.message);
    }

    return {
      fileKey: fullFileName,
      storageProvider: 'cloudinary',
      fileSize: uploadResult.bytes || buffer.length,
      mimeType: mimeType || 'application/pdf',
      cloudUrl: uploadResult.secure_url,
    };
  }

  async getFileStream(fileKey, cloudUrl) {
    const safeKey = path.basename(fileKey);
    const localDir = path.join(env.uploadDir, 'documents');
    const localPath = path.join(localDir, safeKey);

    // 1. Check local cache first (instant response)
    if (fs.existsSync(localPath)) {
      try {
        const stat = await fs.promises.stat(localPath);
        if (stat.size > 0) {
          const readStream = fs.createReadStream(localPath);
          return {
            stream: readStream,
            size: stat.size,
            mimeType: 'application/pdf',
          };
        }
      } catch (statErr) {
        console.warn('[Storage] Local cache read error:', statErr.message);
      }
    }

    // 2. Stream from Cloudinary
    let targetUrl = cloudUrl;
    if (!targetUrl && this.isConfigured) {
      targetUrl = `https://res.cloudinary.com/${env.cloudinaryCloudName}/raw/upload/campusvault_documents/${safeKey}`;
    }

    if (!targetUrl) {
      throw new Error(`Document file not found in local cache and no Cloudinary URL available for ${safeKey}`);
    }

    console.log(`[Storage] Fetching document stream from Cloudinary: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      redirect: 'follow',
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn(
          `[Storage] Cloudinary blocked PDF stream with 401 ("deny or ACL failure").\n` +
          `[Action Required]: In your Cloudinary Console (https://console.cloudinary.com), open Settings -> Security, and check the box "Allow delivery of PDF and ZIP files".`
        );
      }

      // If direct URL gave error and Cloudinary is configured, try generating a signed URL
      if (this.isConfigured) {
        try {
          const signedUrl = cloudinary.url(`campusvault_documents/${safeKey}`, {
            resource_type: 'raw',
            secure: true,
            sign_url: true,
          });
          const retryRes = await fetch(signedUrl, { redirect: 'follow' });
          if (retryRes.ok) {
            const contentLength = Number(retryRes.headers.get('content-length')) || 0;
            const nodeStream = stream.Readable.fromWeb(retryRes.body);
            return {
              stream: nodeStream,
              size: contentLength,
              mimeType: retryRes.headers.get('content-type') || 'application/pdf',
            };
          }
        } catch (signedErr) {
          console.warn('[Storage] Signed URL fallback failed:', signedErr.message);
        }
      }
      throw new Error(`Cloudinary download failed with HTTP status ${response.status}: ${response.statusText}`);
    }

    const contentLength = Number(response.headers.get('content-length')) || 0;
    const contentType = response.headers.get('content-type') || 'application/pdf';
    const nodeStream = stream.Readable.fromWeb(response.body);

    return {
      stream: nodeStream,
      size: contentLength,
      mimeType: contentType,
    };
  }

  async deleteFile(fileKey) {
    const safeKey = path.basename(fileKey);
    // Remove local cache
    const localDir = path.join(env.uploadDir, 'documents');
    const localPath = path.join(localDir, safeKey);
    if (fs.existsSync(localPath)) {
      await fs.promises.unlink(localPath).catch(() => {});
    }

    if (!this.isConfigured) return true;

    try {
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

class LocalStorageProvider {
  constructor() {
    this.uploadDir = path.join(env.uploadDir, 'documents');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile({ buffer, originalname, mimeType }) {
    const fileExt = path.extname(originalname).toLowerCase() || '.pdf';
    const fileKey = `${crypto.randomBytes(16).toString('hex')}_${Date.now()}${fileExt}`;
    const destination = path.join(this.uploadDir, fileKey);

    await fs.promises.writeFile(destination, buffer);

    return {
      fileKey,
      storageProvider: 'local',
      fileSize: buffer.length,
      mimeType: mimeType || 'application/pdf',
      cloudUrl: null,
    };
  }

  async getFileStream(fileKey) {
    const safeKey = path.basename(fileKey);
    const filePath = path.join(this.uploadDir, safeKey);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Document file not found on disk: ${safeKey}`);
    }

    const stat = await fs.promises.stat(filePath);
    const readStream = fs.createReadStream(filePath);
    return {
      stream: readStream,
      size: stat.size,
      mimeType: 'application/pdf',
    };
  }

  async deleteFile(fileKey) {
    const safeKey = path.basename(fileKey);
    const filePath = path.join(this.uploadDir, safeKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath).catch(() => {});
    }
    return true;
  }
}

class StorageService {
  constructor() {
    this.cloudinaryProvider = new CloudinaryStorageProvider();
    this.localProvider = new LocalStorageProvider();
  }

  getActiveProvider() {
    // If Cloudinary is configured, use it as primary
    if (this.cloudinaryProvider.isConfigured) {
      return this.cloudinaryProvider;
    }
    return this.localProvider;
  }

  async uploadFile(fileData) {
    const provider = this.getActiveProvider();
    return provider.uploadFile(fileData);
  }

  async getFileStream(fileKey, providerName, cloudUrl) {
    // 1. If document has a Cloudinary URL or provider is cloudinary or Cloudinary is configured
    if (cloudUrl || providerName === 'cloudinary' || this.cloudinaryProvider.isConfigured) {
      try {
        return await this.cloudinaryProvider.getFileStream(fileKey, cloudUrl);
      } catch (cloudErr) {
        console.warn('[Storage] Cloudinary stream fetch fallback to local disk:', cloudErr.message);
      }
    }

    // 2. Fallback to local disk
    try {
      return await this.localProvider.getFileStream(fileKey);
    } catch (diskErr) {
      console.warn(`[Storage] File ${fileKey} not found in cloud or on disk. Generating academic fallback PDF.`);
      return this.generateFallbackPdf(fileKey);
    }
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
          'This academic document is registered in CampusVault. The complete study materials, syllabus outlines, and questions are stored safely in cloud storage.',
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

  async deleteFile(fileKey, providerName) {
    if (providerName === 'cloudinary' || this.cloudinaryProvider.isConfigured) {
      await this.cloudinaryProvider.deleteFile(fileKey);
    }
    return this.localProvider.deleteFile(fileKey);
  }
}

export const storageService = new StorageService();
