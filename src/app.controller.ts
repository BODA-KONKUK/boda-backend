import {
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
import { AppService } from './app.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

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
