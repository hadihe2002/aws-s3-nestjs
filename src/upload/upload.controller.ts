import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  Head,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return await this.uploadService.upload(file.originalname, file.buffer);
  }

  @Get('/:fileId/status')
  async getObjectStat(@Param('fileId') fileId: string) {
    const result = await this.uploadService.getObjectStat(fileId);
    return result;
  }

  @Get('/:fileId')
  async getObject(@Param('fileId') fileId: string) {
    const result = await this.uploadService.getObject(fileId);
    return result.url;
  }

  @Get()
  async getObjectsList() {
    return await this.uploadService.getList();
  }
}
