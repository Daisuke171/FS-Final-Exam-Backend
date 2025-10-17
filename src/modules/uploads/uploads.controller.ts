import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Get,
  Param,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Response } from 'express';
import type { Multer } from 'multer';
import { existsSync, mkdirSync } from 'fs';

const avatarsDir = join(process.cwd(), 'public', 'img', 'avatars');
const storage = diskStorage({
  destination: (_req, _file, cb) => {
    if (!existsSync(avatarsDir)) mkdirSync(avatarsDir, { recursive: true });
    cb(null, avatarsDir);
  },
  filename: (_req, file, cb) => {
    const filename = `${Date.now()}_img_${extname(file.originalname)}`;
    cb(null, filename);
  },
});

@Controller('uploads')
export class UploadsController {
  // POST /uploads/avatars (form-data key: file)
  @Post('avatars')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter: (_req, file, cb) => {
        // Basic image filter
        if (!file.mimetype.startsWith('image/')) {
          return cb(
            new BadRequestException('Only images are allowed') as any,
            false,
          );
        }
        cb(null, true);
      },
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  uploadAvatar(@UploadedFile() file?: Multer['File']) {
    if (!file) throw new BadRequestException('No file uploaded');
    return {
      filename: file.filename,
      url: `/uploads/avatars/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  // GET /uploads/avatars/:filename => serves the stored image directly
  @Get('avatars/:filename')
  getAvatar(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = join(avatarsDir, filename);
    if (!existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }
    return res.sendFile(filePath);
  }
}
