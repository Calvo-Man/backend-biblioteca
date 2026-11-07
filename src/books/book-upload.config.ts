import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { mkdir } from 'fs';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const bookCoverUploadOptions = {
  storage: diskStorage({
    destination: (req, file, callback) => {
      const uploadPath = join(
        process.cwd(),
        'uploads',
        'book-covers',
      );

      mkdir(uploadPath, { recursive: true }, (error) => {
        if (error) {
          return callback(error, uploadPath);
        }

        callback(null, uploadPath);
      });
    },

    filename: (req, file, callback) => {
      const extension = extname(file.originalname).toLowerCase();

      callback(null, `${randomUUID()}${extension}`);
    },
  }),

  fileFilter: (req: any, file: any, callback: any) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Formato de imagen no permitido. Usa JPG, PNG o WEBP.',
        ),
        false,
      );
    }

    callback(null, true);
  },

  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};