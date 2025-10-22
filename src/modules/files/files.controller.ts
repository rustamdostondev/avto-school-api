import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { BufferedFile } from './interfaces';
import { Response } from 'express';
import { User } from '@common/decorators/user.decorator';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RESOURCES } from '@common/constants';

@ApiTags('Files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('authorization')
@Controller({
  path: RESOURCES.FILES,
  version: '1',
})
export class FilesController {
  constructor(private filesService: FilesService) {}

  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  createFile(@UploadedFile() file: BufferedFile, @User() user: IUserSession) {
    return this.filesService.upload(file, user);
  }

  @ApiOperation({ summary: 'Download a file' })
  @Get(':id/download')
  getFile(@Param('id') fileId: string, @User() user: IUserSession, @Res() response: Response) {
    return this.filesService.download({ fileId }, user, response);
  }
}
