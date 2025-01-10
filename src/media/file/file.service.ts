import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { join, dirname } from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { AccessLevel, File } from '@prisma/client';
import * as sharp from 'sharp';
import { AwsService } from 'src/aws/aws.service';

@Injectable()
export class FileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AwsService,
  ) {}

  async uploadMedia({
    file,
    workspaceId,
    accessLevel,
  }: {
    file: Express.Multer.File;
    workspaceId: string;
    accessLevel?: AccessLevel;
  }): Promise<File> {
    // Save file information to the database
    const fileS3Key = await this.awsService.uploadFile({
      originalname: file.originalname,
      mimetype: file.mimetype,
      path: file.path,
      accessLevel: accessLevel,
    });
    const media = await this.prisma.file.create({
      data: {
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: file.path,
        workspaceId,
        accessLevel: accessLevel ?? AccessLevel.RESTRICTED,
        s3Key: fileS3Key,
      },
    });

    return media;
  }

  async saveFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    const uploadPath = this.uploadPath(join('uploads', file.originalname));

    const absUploadPath = join(process.cwd(), 'public', uploadPath);
    const uploadDir = dirname(absUploadPath);

    // Ensure the uploads directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Save the file
    await fs.writeFile(absUploadPath, file.buffer);

    return `/${uploadPath}`;
  }

  uploadPath(originalFilePath: string): string {
    const extension = path.extname(originalFilePath);
    const newFilename = `${uuidv4()}${extension}`;
    const newFilePath = path.join(path.dirname(originalFilePath), newFilename);
    return newFilePath;
  }

  async deleteFile(path: string): Promise<void> {
    // Delete file from the filesystem
    await fs.unlink(join(process.cwd(), 'public', path));
  }

  async cropImage(file: File, cropInput: sharp.Region) {
    const originalFilePath = join(process.cwd(), 'public', file.url);

    const extension = path.extname(originalFilePath);
    const basePath = originalFilePath.replace(extension, '');

    let filePath = '';

    if (cropInput.left) {
      filePath += 'x-' + cropInput.left;
    }

    if (cropInput.top) {
      filePath += 'y-' + cropInput.top;
    }

    if (cropInput.width) {
      filePath += 'w-' + cropInput.width;
    }
    if (cropInput.width && cropInput.height) {
      filePath += 'x';
    }
    if (cropInput.height) {
      filePath += 'h-' + cropInput.height;
    }

    const metadata = await sharp(originalFilePath).metadata();
    const newFilePath = `${basePath}${filePath ? '-' + filePath : ''}${extension}`;

    if (metadata.width && metadata.height) {
      await sharp(originalFilePath).extract(cropInput).toFile(newFilePath);
    }

    return newFilePath.replace(join(process.cwd(), 'public'), '');
  }

  async resizeImage(file: File, resizeInput: sharp.Region) {
    const originalFilePath = join(process.cwd(), 'public', file.url);

    const extension = path.extname(originalFilePath);
    const basePath = originalFilePath.replace(extension, '');

    let filePath = '';

    if (resizeInput.width) {
      filePath += 'w-' + resizeInput.width;
    }
    if (resizeInput.height) {
      filePath += 'h-' + resizeInput.height;
    }

    const metadata = await sharp(originalFilePath).metadata();
    const newFilePath = `${basePath}${filePath ? '-' + filePath : ''}${extension}`;

    if (metadata.width && metadata.height) {
      await sharp(originalFilePath).resize(resizeInput).toFile(newFilePath);
    }

    return newFilePath.replace(join(process.cwd(), 'public'), '');
  }
}
