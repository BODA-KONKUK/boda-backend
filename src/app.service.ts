import { Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ConfigService } from '@nestjs/config';
import * as mimeTypes from 'mime-types';
@Injectable()
export class AppService {
  private s3Client: S3Client;

  getHello(): string {
    return 'Hello World!!';
  }

  constructor(private readonly config: ConfigService) {
    this.s3Client = new S3Client({
      region: 'ap-northeast-2',
      credentials: {
        accessKeyId: this.config.get<string>('ACCESS_KEY_ID'),
        secretAccessKey: this.config.get<string>('SECRET_ACCESS_KEY'),
      },
    });
  }

  async fileUpload(file: Express.Multer.File) {
    const contentType =
      mimeTypes.lookup(file.originalname) || 'application/octet-stream';

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: 'boda-bucket', // S3 버킷 이름
        Key: `uploads/${file.originalname}`, // 파일을 저장할 S3 내의 경로 및 파일 이름
        Body: file.buffer, // 파일 데이터
        ContentType: contentType, // ContentType 설정
      },
    });

    try {
      const result = await upload.done();
      console.log('File uploaded:', result);
      return result;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}
