import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class UploadService {
  private readonly s3Client = new S3Client({
    region: this.configService.getOrThrow('AWS_S3_REGION'),
    credentials: {
      accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
    },
  });

  constructor(private readonly configService: ConfigService) {}

  async upload(filename: string, file: Buffer) {
    const result = await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
        Key: filename,
        Body: file,
        Metadata: { testMeta: 'info' },
      }),
    );
    return result;
  }

  async getList() {
    return await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
      }),
    );
  }

  async getObject(filename: string) {
    const response = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
        Key: filename,
      }),
    );

    const body = response.Body;
    const url = await this.generatePresignedUrl(filename);

    return {
      $metadata: response.$metadata,
      Metadata: response.Metadata,
      ContentLength: response.ContentLength,
      ETag: response.ETag,
      LastModified: response.LastModified,
      data: await body.transformToString(),
      url,
    };
  }

  async getObjectStat(filename: string) {
    try {
      const response = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
          Key: filename,
        }),
      );
      return response;
    } catch (err) {
      if (err.name === 'NotFound') {
        throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
      }
    }
  }

  async generatePresignedUrl(filename: string) {
    const command = new GetObjectCommand({
      Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
      Key: filename,
    });

    try {
      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 60 });
      return url;
    } catch (error) {
      throw error;
    }
  }
}
