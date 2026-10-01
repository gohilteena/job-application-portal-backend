import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { Readable } from 'stream';

/**
 * Storage abstraction. Replace LocalStorageProvider with an S3/Cloudinary
 * implementation of this interface; nothing else in the app needs to change.
 */
export interface StorageProvider {
  save(input: { buffer: Buffer; originalName: string; ownerId: string }): Promise<string>; // returns storage key
  remove(key: string): Promise<void>;
  read(key: string): Promise<Readable | null>; // null when the file no longer exists
}

class LocalStorageProvider implements StorageProvider {
  private readonly dir = path.resolve(process.cwd(), 'uploads', 'resumes');

  // basename() blocks path traversal via a tampered key
  private resolve(key: string): string {
    return path.join(this.dir, path.basename(key));
  }

  async save({ buffer, originalName, ownerId }: { buffer: Buffer; originalName: string; ownerId: string }): Promise<string> {
    await fs.promises.mkdir(this.dir, { recursive: true });
    const ext = path.extname(originalName).toLowerCase();
    const key = `${ownerId}-${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    await fs.promises.writeFile(this.resolve(key), buffer);
    return key;
  }

  async remove(key: string): Promise<void> {
    await fs.promises.rm(this.resolve(key), { force: true });
  }

  async read(key: string): Promise<Readable | null> {
    const file = this.resolve(key);
    try {
      await fs.promises.access(file);
    } catch {
      return null;
    }
    return fs.createReadStream(file);
  }
}

export const resumeStorage: StorageProvider = new LocalStorageProvider();
