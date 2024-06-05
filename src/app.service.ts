import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { HfInference } from '@huggingface/inference';
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as mimeTypes from 'mime-types';
import * as util from 'util';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';

@Injectable()
export class AppService {
  // @InjectRepository(Board)
  // private boardRepository: Repository<Board>;
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.s3Client = new S3Client({
      region: 'ap-northeast-2',
      credentials: {
        accessKeyId: this.config.get<string>('ACCESS_KEY_ID'),
        secretAccessKey: this.config.get<string>('SECRET_ACCESS_KEY'),
      },
    });
  }

  private s3Client: S3Client;

  async query(data: string): Promise<any> {
    const API_TOKEN = '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';

    const response = await fetch(
      'https://api-inference.huggingface.co/models/gpt2',
      {
        headers: { Authorization: `Bearer ${API_TOKEN}` },
        method: 'POST',
        body: JSON.stringify(data),
      },
    );

    const result = response.json();

    return result;
  }

  async visualQuestionAnswering1() {
    const hf = new HfInference('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');
    const vqa = hf.endpoint(
      'https://wvgrnujoe7nwlw1v.us-east-1.aws.endpoints.huggingface.cloud',
    );

    const readFile = util.promisify(fs.readFile);
    const imageBuffer = await readFile('src/hello.png');
    const base64Image = imageBuffer.toString('base64');

    // const arrayBuffer = imageBuffer.buffer.slice(
    //   imageBuffer.byteOffset,
    //   imageBuffer.byteOffset + imageBuffer.byteLength,
    // );

    const response = await vqa.visualQuestionAnswering({
      model: 'memegpt/blip2_endpoint',
      inputs: {
        question: 'What is written here?',
        image: base64Image as any,
      },
    });

    return response;
  }

  async visualQuestionAnswering() {
    const hf = new HfInference('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');
    const readFile = util.promisify(fs.readFile);

    // 'cats.png' 파일을 비동기적으로 읽습니다. 파일 경로는 실제 상황에 맞게 조정해야 합니다.
    const imageBuffer = await readFile('src/hello.png');
    const arrayBuffer = imageBuffer.buffer.slice(
      imageBuffer.byteOffset,
      imageBuffer.byteOffset + imageBuffer.byteLength,
    );

    const response = await hf.visualQuestionAnswering({
      model: 'memegpt/blip2_endpoint',
      inputs: {
        question: 'What is written here?',
        image: arrayBuffer,
      },
    });

    return response;
  }

  async getHello(): Promise<string> {
    // const res = await this.query(
    //   'Tell me about the capital of the United States',
    // );
    // console.log('answer', JSON.stringify(res));

    // const res = await this.visualQuestionAnswering1();
    // console.log('answer', JSON.stringify(res));

    return 'Hello World!!';
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
      console.log('File uploaded:', result.Location);
      return result.Location;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}
