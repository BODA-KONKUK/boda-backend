import {
  Body,
  Controller,
  Get,
  Param,
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

  @Post('/api/list')
  async create(@Body() createUserDto: any) {
    return await this.appService.create(createUserDto);
  }

  @Get('/api/list/:id')
  async getOne(
    @Param('id')
    id: string,
  ) {
    return await this.appService.getOne(id);
  }

  @Get('/api/list')
  async list() {
    return await this.appService.getAll();
  }
}
