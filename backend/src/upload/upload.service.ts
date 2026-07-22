import { Injectable, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

@Injectable()
export class UploadService {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB

  async uploadImage(file: Express.Multer.File, folder: string = 'general') {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.',
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        'File size exceeds maximum limit of 5MB.',
      );
    }

    let ext = path.extname(file.originalname).toLowerCase();
    if (!ext || !['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      switch (file.mimetype) {
        case 'image/jpeg':
        case 'image/jpg':
          ext = '.jpg';
          break;
        case 'image/png':
          ext = '.png';
          break;
        case 'image/webp':
          ext = '.webp';
          break;
        case 'image/gif':
          ext = '.gif';
          break;
        default:
          ext = '.jpg';
      }
    }

    const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'general';
    const filename = `${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'uploads', sanitizedFolder);

    if (!existsSync(uploadDir)) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, file.buffer);

    return {
      url: `/uploads/${sanitizedFolder}/${filename}`,
      filename,
    };
  }
}
