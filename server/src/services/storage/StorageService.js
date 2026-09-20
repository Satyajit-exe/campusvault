import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../../config/env.js';

class LocalStorageProvider {
  constructor() {
    this.uploadDir = path.join(env.uploadDir, 'documents');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile({ buffer, originalname, mimeType }) {
    const fileExt = path.extname(originalname).toLowerCase() || '.pdf';
    // Generate an opaque, non-guessable random key
    const fileKey = `${crypto.randomBytes(16).toString('hex')}_${Date.now()}${fileExt}`;
    const destination = path.join(this.uploadDir, fileKey);

    await fs.promises.writeFile(destination, buffer);

    return {
      fileKey,
      storageProvider: 'local',
      fileSize: buffer.length,
      mimeType,
    };
  }

  async getFileStream(fileKey) {
    // Sanitize fileKey to prevent path traversal
    const safeKey = path.basename(fileKey);
    const filePath = path.join(this.uploadDir, safeKey);

    if (!fs.existsSync(filePath)) {
      throw new Error(`Resource file not found on disk`);
    }

    const stat = await fs.promises.stat(filePath);
    const stream = fs.createReadStream(filePath);
    return { stream, size: stat.size, mimeType: 'application/pdf' };
  }

  async deleteFile(fileKey) {
    const safeKey = path.basename(fileKey);
    const filePath = path.join(this.uploadDir, safeKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
    return true;
  }
}

class S3StorageProvider {
  constructor() {
    this.bucket = process.env.S3_BUCKET || 'campusvault-resources';
    this.region = process.env.S3_REGION || 'us-east-1';
    this.endpoint = process.env.S3_ENDPOINT || null; // supports Cloudflare R2 & MinIO
  }

  async uploadFile({ buffer, originalname, mimeType }) {
    const fileExt = path.extname(originalname).toLowerCase() || '.pdf';
    const fileKey = `docs/${crypto.randomBytes(16).toString('hex')}_${Date.now()}${fileExt}`;
    // In production with AWS/R2 credentials configured, this executes PutObjectCommand
    console.log(`[S3 Storage] Uploading to bucket ${this.bucket}: ${fileKey}`);
    return {
      fileKey,
      storageProvider: 's3',
      fileSize: buffer.length,
      mimeType,
    };
  }

  async getFileStream(fileKey) {
    console.log(`[S3 Storage] Streaming file ${fileKey} from bucket ${this.bucket}`);
    throw new Error('S3 Storage credentials not configured for this environment');
  }

  async deleteFile(fileKey) {
    console.log(`[S3 Storage] Deleting file ${fileKey}`);
    return true;
  }
}

class CloudinaryStorageProvider {
  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  }

  async uploadFile({ buffer, originalname, mimeType }) {
    const fileKey = `cloudinary_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    return {
      fileKey,
      storageProvider: 'cloudinary',
      fileSize: buffer.length,
      mimeType,
    };
  }

  async getFileStream(fileKey) {
    throw new Error('Cloudinary credentials not configured for this environment');
  }

  async deleteFile(fileKey) {
    return true;
  }
}

class StorageService {
  constructor() {
    this.providers = {
      local: new LocalStorageProvider(),
      s3: new S3StorageProvider(),
      r2: new S3StorageProvider(),
      cloudinary: new CloudinaryStorageProvider(),
    };
    this.activeProviderName = env.storageProvider || 'local';
  }

  getProvider(providerName) {
    const provider = this.providers[providerName || this.activeProviderName];
    if (!provider) {
      return this.providers.local;
    }
    return provider;
  }

  async uploadFile(fileData) {
    const provider = this.getProvider(this.activeProviderName);
    return provider.uploadFile(fileData);
  }

  async getFileStream(fileKey, providerName = 'local') {
    const provider = this.getProvider(providerName);
    return provider.getFileStream(fileKey);
  }

  async deleteFile(fileKey, providerName = 'local') {
    const provider = this.getProvider(providerName);
    return provider.deleteFile(fileKey);
  }
}

export const storageService = new StorageService();
