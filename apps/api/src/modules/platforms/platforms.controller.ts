import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PlatformsService } from './platforms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePlatformDto } from './create-platform.dto';
import { UpdatePlatformDto } from './update-platform.dto';

@ApiTags('Platforms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('platforms')
export class PlatformsController {
  constructor(private readonly platformsService: PlatformsService) {}

  @Get()
  @ApiOperation({ summary: 'List all platform profiles' })
  async findAll(@Req() req: any) {
    return this.platformsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get platform profile by id' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.platformsService.findOne(id, req.user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create platform profile' })
  async create(@Body() dto: CreatePlatformDto, @Req() req: any) {
    return this.platformsService.create(dto, req.user.organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update platform profile' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlatformDto,
    @Req() req: any,
  ) {
    return this.platformsService.update(id, dto, req.user.organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete platform profile' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.platformsService.remove(id, req.user.organizationId);
  }
}
