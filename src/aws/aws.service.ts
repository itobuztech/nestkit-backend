import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import appEnv from 'src/env';
import { AccessLevel, File } from '@prisma/client';
import { CreateAppError } from 'src/shared/create-error/create-error';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { uploadFileInput } from './upload-file.input.dto';

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

  async uploadFile(
    file: uploadFileInput,
    workspaceId: string,
    accessLevel?: AccessLevel,
  ) {
    // creating key for storing file in aws
    const fileName = file.name.replace(/[^\w.](?=.*\.)/g, '_');
    const key = `${workspaceId}/${Date.now().toString()}-${fileName.trim()}`;

    // creating object to sed to s3 bucket
    const command = new PutObjectCommand({
      Bucket:
        accessLevel === AccessLevel.PUBLIC
          ? appEnv.AWS_PUBLIC_BUCKET
          : appEnv.AWS_SECURE_BUCKET,
      Key: key,
      Body: file.fileBuffer,
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

  async getUploadedFile(s3Key: string, accessLevel: AccessLevel) {
    const command = new GetObjectCommand({
      Bucket:
        accessLevel === AccessLevel.PUBLIC
          ? appEnv.AWS_PUBLIC_BUCKET
          : appEnv.AWS_SECURE_BUCKET,
      Key: s3Key,
    });
    const response = await this.s3Client.send(command);

    if (response.Body) {
      const fileBuffer = Buffer.from(
        await response.Body.transformToByteArray(),
      );

      return fileBuffer;
    } else {
      throw new CreateAppError({
        message: 'Error in getting Files',
      });
    }
  }
}
