import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('kpi')
  @ApiOperation({ summary: 'Dashboard KPIs' })
  async getKpi(
    @Query('days') days: number = 30,
    @Req() req: any,
  ) {
    return this.analyticsService.getKpi(req.user.organizationId, days);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Dashboard KPIs (alias for frontend compat)' })
  async getKpis(
    @Query('days') days: number = 30,
    @Req() req: any,
  ) {
    return this.analyticsService.getKpi(req.user.organizationId, days);
  }

  @Get('by-platform')
  @ApiOperation({ summary: 'Posts by platform with counts' })
  async getByPlatform(
    @Query('days') days: number = 30,
    @Req() req: any,
  ) {
    return this.analyticsService.getByPlatform(req.user.organizationId, days);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Recent published posts' })
  async getRecent(
    @Query('limit') limit: number = 5,
    @Req() req: any,
  ) {
    return this.analyticsService.getRecent(req.user.organizationId, limit);
  }
}
