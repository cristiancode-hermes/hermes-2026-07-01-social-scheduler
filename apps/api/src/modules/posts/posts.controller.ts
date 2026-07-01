import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePostDto } from './create-post.dto';
import { UpdatePostDto } from './update-post.dto';
import { RescheduleDto } from './reschedule.dto';
import { QueryPostDto } from './query-post.dto';

@ApiTags('Posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  @ApiOperation({ summary: 'List posts with filters' })
  async findAll(@Query() query: QueryPostDto, @Req() req: any) {
    return this.postsService.findAll(query, req.user.organizationId);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get posts grouped by date for calendar' })
  async getCalendar(
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
    @Req() req: any,
  ) {
    return this.postsService.getCalendar(month, year, req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get post detail with versions' })
  async findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.postsService.findOne(id, req.user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  async create(@Body() dto: CreatePostDto, @Req() req: any) {
    return this.postsService.create(dto, req.user.id, req.user.organizationId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update post (creates new version if content changes)' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @Req() req: any,
  ) {
    return this.postsService.update(id, dto, req.user.id, req.user.organizationId);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Quick reschedule (for drag & drop)' })
  async reschedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RescheduleDto,
    @Req() req: any,
  ) {
    return this.postsService.reschedule(id, dto, req.user.organizationId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a post' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.postsService.remove(id, req.user.organizationId);
  }
}
