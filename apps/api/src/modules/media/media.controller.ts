import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiOperation({ summary: 'List media assets with pagination' })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('type') type: string | undefined,
    @Req() req: any,
  ) {
    return this.mediaService.findAll(req.user.organizationId, page, limit, type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single media asset' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.mediaService.findOne(id, req.user.organizationId);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload an image/file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: any,
    @Req() req: any,
  ) {
    return this.mediaService.upload(file, req.user.organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media asset and file' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.mediaService.remove(id, req.user.organizationId);
  }
}
