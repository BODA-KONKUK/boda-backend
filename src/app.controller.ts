import {
  Body,
  // Body,
  Controller,
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

  // @Get()
  // async getHello(): Promise<string> {
  //   console.log('getHello 요청');
  //   return this.appService.getHello('gi', 'what is he doing?');
  // }

  // 질의 응답
  @Post('/question')
  async getQuestion(@Body() body: { imgUrl: string; message: string }) {
    // console.log('imgUrl: ', body.imgUrl);
    // console.log('text: ', body.message);

    const res = await this.appService.vqa(body.imgUrl, body.message);

    console.log(res);

    return { message: res };
  }

  // 사진 촬영 및 캡셔닝
  @Post('/upload/file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    // console.log('file', file);

    return this.appService.fileUpload(file);
  }
}
