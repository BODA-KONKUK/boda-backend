import {
  Body,
  // Body,
  Controller,
  // Delete,
  Get,
  // Param,
  // Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(): Promise<string> {
    console.log('getHello 요청');
    return this.appService.getHello('what is he doing?');
  }

  // 질의 응답
  @Post('/question')
  async getQuestion(@Body() body: { imgUrl: string; text: string }) {
    console.log('imgUrl: ', body.imgUrl);
    console.log('text: ', body.text);
    console.log('body: ', body);
    const responseMessage = `테스트 완료 보낸 질문은 ${body.text}`;
    return { message: responseMessage }; // JSON 형식으로 반환
  }

  // 사진 촬영 및 캡셔닝
  @Post('/upload/file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    // console.log('file', file);

    return this.appService.fileUpload(file);
  }
}
