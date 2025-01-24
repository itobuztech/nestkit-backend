import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { join, dirname } from 'path';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { AccessLevel, File } from '@prisma/client';
import * as sharp from 'sharp';
import { AwsService } from 'src/aws/aws.service';
import appEnv from 'src/env';

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
    //store file in s3 and get its address
    let fileS3Key: string | null = null;
    const fileName = this.uploadPath(file.originalname);
    fileS3Key = await this.awsService.uploadFile(
      {
        name: fileName,
        mimetype: file.mimetype,
        fileBuffer: file.buffer,
      },
      workspaceId,
      accessLevel,
    );

    // Get file url
    const fileUrl = await this.awsService.getfileUrl(fileS3Key, accessLevel!);

    // Save file information to the database
    const media = await this.prisma.file.create({
      data: {
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        workspaceId,
        accessLevel: accessLevel ?? AccessLevel.RESTRICTED,
        s3Key: fileS3Key,
        url: fileUrl,
      },
    });

    // store signed url in database
    if (media.accessLevel === AccessLevel.RESTRICTED) {
      await this.prisma.s3AccessSession.create({
        data: {
          signedUrl: fileUrl,
          fileId: media.id,
          expiresAt: new Date(Date.now() + appEnv.SIGNED_URL_EXPIRY * 1000),
        },
      });
    }

    return media;
  }

  async saveFile({
    file,
    workspaceId,
    accessLevel,
  }: {
    file: Express.Multer.File;
    workspaceId: string;
    accessLevel?: AccessLevel;
  }): Promise<File> {
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

    const media = await this.prisma.file.create({
      data: {
        name: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: uploadPath,
        workspaceId,
        accessLevel: accessLevel ?? AccessLevel.RESTRICTED,
      },
    });

    return media;
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

  async cropImage(file: File, cropInput: sharp.Region, fileBuffer: Buffer) {
    // creating file name/path
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

    // Fetching old file metadata
    const metadata = await sharp(fileBuffer).metadata();

    // creating new file with cropped image
    if (metadata.width && metadata.height) {
      cropInput.width = metadata.width;
      cropInput.height = metadata.height;
      cropInput.top = cropInput.top ?? 0;
      cropInput.left = cropInput.left ?? 0;
    }

    const croppedBuffer = await sharp(fileBuffer).extract(cropInput).toBuffer();

    // Storing the new file
    if (appEnv.isS3Enabled) {
      const fileName = this.uploadPath(file.name);
      const extension = path.extname(fileName);

      const baseName = fileName.replace(extension, '');
      const newFileName = `${baseName}${filePath ? '-' + filePath : ''}${extension}`;

      return await this.awsService.uploadFile(
        {
          name: newFileName,
          mimetype: file.mimeType,
          fileBuffer: croppedBuffer,
        },
        file.workspaceId!,
        file.accessLevel!,
      );
    } else {
      const fileUrl = this.uploadPath(join('uploads', file.name));
      const originalFilePath = join(process.cwd(), 'public', fileUrl);

      const extension = path.extname(originalFilePath);
      const basePath = originalFilePath.replace(extension, '');

      const newFilePath = `${basePath}${filePath ? '-' + filePath : ''}${extension}`;

      await fs.writeFile(newFilePath, croppedBuffer);
      return newFilePath.replace(join(process.cwd(), 'public'), '');
    }
  }

  async resizeImage(file: File, resizeInput: sharp.Region, fileBuffer: Buffer) {
    // creating file name/path
    let filePath = '';
    if (resizeInput.width) {
      filePath += 'w-' + resizeInput.width;
    }
    if (resizeInput.height) {
      filePath += 'h-' + resizeInput.height;
    }

    // Fetching old file metadata
    const metadata = await sharp(fileBuffer).metadata();

    // creating new file with cropped image
    if (metadata.width && metadata.height) {
      const aspectRatio = metadata.width / metadata.height;

      if (!resizeInput.width && resizeInput.height) {
        resizeInput.width = Math.ceil(resizeInput.height * aspectRatio);
      }

      if (!resizeInput.height && resizeInput.width) {
        resizeInput.height = Math.ceil(resizeInput.width / aspectRatio);
      }
    }

    const resizedBuffer = await sharp(fileBuffer)
      .resize(resizeInput)
      .toBuffer();

    // Storing the new file
    if (appEnv.isS3Enabled) {
      const fileName = this.uploadPath(file.name);
      const extension = path.extname(fileName);

      const baseName = fileName.replace(extension, '');
      const newFileName = `${baseName}${filePath ? '-' + filePath : ''}${extension}`;

      return await this.awsService.uploadFile(
        {
          name: newFileName,
          mimetype: file.mimeType,
          fileBuffer: resizedBuffer,
        },
        file.workspaceId!,
        file.accessLevel!,
      );
    } else {
      const fileUrl = this.uploadPath(join('uploads', file.name));
      const originalFilePath = join(process.cwd(), 'public', fileUrl);

      const extension = path.extname(originalFilePath);
      const basePath = originalFilePath.replace(extension, '');

      const newFilePath = `${basePath}${filePath ? '-' + filePath : ''}${extension}`;

      await fs.writeFile(newFilePath, resizedBuffer);
      return newFilePath.replace(join(process.cwd(), 'public'), '');
    }
  }
}
