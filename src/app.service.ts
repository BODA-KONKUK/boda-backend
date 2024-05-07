import { Injectable } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { ConfigService } from '@nestjs/config';
import * as mimeTypes from 'mime-types';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Board } from './board.entity';
// import { Repository } from 'typeorm';
@Injectable()
export class AppService {
  // @InjectRepository(Board)
  // private boardRepository: Repository<Board>;
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

  async fileUpload(files: any) {
    const file = files[0];

    console.log('file', file);

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

  // async create(createUserDto: any) {
  //   const user = await this.boardRepository.create({
  //     title: createUserDto.title,
  //     content: createUserDto.content,
  //     writer: createUserDto.writer,
  //   });

  //   return await this.boardRepository.save(user);
  // }

  // async getOne(userId: string) {
  //   return await this.boardRepository.findOne({ where: { id: +userId } });
  // }

  // async getAll() {
  //   return await this.boardRepository.find();
  // }

  // async delete(id: string) {
  //   const post = await this.boardRepository.findOne({ where: { id: +id } });

  //   if (!post) {
  //     throw new Error('Post not found');
  //   }

  //   return await this.boardRepository.remove(post);
  // }

  // async update(id: string, updateBoardDto: any) {
  //   const post = await this.boardRepository.findOne({ where: { id: +id } });

  //   if (!post) {
  //     throw new Error('Post not found');
  //   }

  //   post.title = updateBoardDto.title;
  //   post.content = updateBoardDto.content;
  //   post.writer = updateBoardDto.writer;

  //   return await this.boardRepository.save(post);
  // }
}
