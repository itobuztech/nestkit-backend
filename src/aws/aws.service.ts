import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import appEnv from 'src/env';
import * as fs from 'fs';
import { AccessLevel } from '@prisma/client';
import { CreateAppError } from 'src/shared/create-error/create-error';
import * as path from 'path';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class AwsService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: appEnv.AWS_REGION,
      credentials: {
        accessKeyId: appEnv.AWS_ACCESS_KEY_ID,
        secretAccessKey: appEnv.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(file: Express.Multer.File, accessLevel?: AccessLevel) {
    // creating key for storing file in aws
    const fileName = file.originalname.replace(/[^\w.](?=.*\.)/g, '_');
    const key = `${Date.now().toString()}-${fileName.trim()}`;

    // creating file buffer
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const filePath = path.join(process.cwd(), 'public', file.path);
      const readStream = fs.createReadStream(filePath);
      readStream
        .on('data', (chunk: Buffer) => chunks.push(chunk))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .on('error', reject);
    });

    const command = new PutObjectCommand({
      Bucket:
        accessLevel === AccessLevel.PUBLIC
          ? appEnv.AWS_PUBLIC_BUCKET
          : appEnv.AWS_SECURE_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.mimetype,
    });

    const res = await this.s3Client.send(command);
    if (res.$metadata.httpStatusCode === 200) {
      const url = key;
      return url;
    } else {
      throw new CreateAppError({
        message: 'Error in file upload',
      });
    }
  }
  async deleteFile(fileName: string, accessLevel: AccessLevel) {
    const command = new DeleteObjectCommand({
      Bucket:
        accessLevel === AccessLevel.PUBLIC
          ? appEnv.AWS_PUBLIC_BUCKET
          : appEnv.AWS_SECURE_BUCKET,
      Key: fileName,
    });
    const res = await this.s3Client.send(command);
    return res;
  }

  async getfileUrl(s3Key: string, accessLevel: AccessLevel) {
    if (accessLevel === AccessLevel.PUBLIC) {
      return `https://${appEnv.AWS_PUBLIC_BUCKET}.s3.amazonaws.com/${s3Key}`;
    } else {
      const command = new GetObjectCommand({
        Bucket: appEnv.AWS_SECURE_BUCKET,
        Key: s3Key,
      });
      const response = await getSignedUrl(this.s3Client, command, {
        expiresIn: appEnv.SIGNED_URL_EXPIRY,
      });
      return response;
    }
  }
}
