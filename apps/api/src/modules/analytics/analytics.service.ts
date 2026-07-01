import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, Not } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { PlatformProfile } from '../../entities/platform-profile.entity';

export interface PlatformStats {
  platform: string;
  handle: string;
  displayName: string;
  total: number;
  published: number;
  scheduled: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(PlatformProfile)
    private platformRepository: Repository<PlatformProfile>,
  ) {}

  async getKpi(organizationId: number, days: number = 30) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const totalPosts = await this.postRepository.count({
      where: { organizationId },
    });

    const publishedThisMonth = await this.postRepository.count({
      where: {
        organizationId,
        status: 'published',
        publishedAt: MoreThan(startDate),
      },
    });

    const scheduled = await this.postRepository.count({
      where: {
        organizationId,
        status: 'scheduled',
      },
    });

    // Engagement rate: percentage of published posts vs total non-draft
    const nonDraft = await this.postRepository.count({
      where: {
        organizationId,
        status: Not('draft'),
      },
    });
    const engagementRate = nonDraft > 0
      ? Math.round((publishedThisMonth / nonDraft) * 100)
      : 0;

    return {
      totalPosts,
      publishedThisMonth,
      scheduled,
      engagementRate,
    };
  }

  async getByPlatform(organizationId: number, days: number = 30) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const profiles = await this.platformRepository.find({
      where: { organizationId },
    });

    const result: PlatformStats[] = [];
    for (const profile of profiles) {
      const total = await this.postRepository.count({
        where: {
          organizationId,
          platformProfileId: profile.id,
        },
      });
      const published = await this.postRepository.count({
        where: {
          organizationId,
          platformProfileId: profile.id,
          status: 'published',
          publishedAt: MoreThan(startDate),
        },
      });
      const scheduled = await this.postRepository.count({
        where: {
          organizationId,
          platformProfileId: profile.id,
          status: 'scheduled',
        },
      });

      result.push({
        platform: profile.platform,
        handle: profile.handle,
        displayName: profile.displayName,
        total,
        published,
        scheduled,
      });
    }

    return result;
  }

  async getRecent(organizationId: number, limit: number = 5) {
    return this.postRepository.find({
      where: {
        organizationId,
        status: 'published',
      },
      relations: { platformProfile: true, user: true },
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }
}
