import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!!';
  }

  fileUpload(file: Express.Multer.File) {
    return file;
  }
}
