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
    return this.appService.getHello();
  }

  // 질의 응답
  @Post('/question')
  async getQuestion(@Body() body: { text: string }) {
    console.log('question: ', body.text);
    const responseMessage = `테스트 완료 보낸 질문은 ${body.text}`;
    return { message: responseMessage }; // JSON 형식으로 반환
  }

  // 사진 촬영 및 캡셔닝
  @Post('/upload/file')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log('file', file);

    return this.appService.fileUpload(file);
  }

  // @Post('/api/post')
  // async create(@Body() createUserDto: any) {
  //   return await this.appService.create(createUserDto);
  // }

  // @Get('/api/post/:id')
  // async getOne(
  //   @Param('id')
  //   id: string,
  // ) {
  //   return await this.appService.getOne(id);
  // }

  // @Patch('/api/post/:id')
  // async update(@Param('id') id: string, @Body() updateBoardDto: any) {
  //   return await this.appService.update(id, updateBoardDto);
  // }

  // @Get('/api/post')
  // async list() {
  //   return await this.appService.getAll();
  // }

  // @Delete('/api/post/:id')
  // async delete(@Param('id') id: string) {
  //   return await this.appService.delete(id);
  // }
}
