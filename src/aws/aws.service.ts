import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import appEnv from 'src/env';
import { AccessLevel } from '@prisma/client';
import { CreateAppError } from 'src/shared/create-error/create-error';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UploadFileInput } from './upload-file.input.dto';

@Injectable()
export class AwsService {
  private readonly s3Client: S3Client;

  constructor() {
    if (appEnv.isS3Enabled) {
      this.s3Client = new S3Client({
        region: appEnv.AWS_REGION,
        credentials: {
          accessKeyId: appEnv.AWS_ACCESS_KEY_ID,
          secretAccessKey: appEnv.AWS_SECRET_ACCESS_KEY,
        },
      });
    }
  }

  async uploadFile(
    file: UploadFileInput,
    workspaceId: string,
    accessLevel?: AccessLevel,
  ) {
    // creating key for storing file in aws
    const key = `${workspaceId}/${file.name}`;

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
      return `${appEnv.AWS_PUBLIC_BUCKET_URL}/${s3Key}`;
    } else {
      const command = new GetObjectCommand({
        Bucket: appEnv.AWS_SECURE_BUCKET,
        Key: s3Key,
      });
      const response = await getSignedUrl(this.s3Client, command, {
        expiresIn: appEnv.AWS_SIGNED_URL_EXPIRY,
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
