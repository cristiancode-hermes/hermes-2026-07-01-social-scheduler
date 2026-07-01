import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { PlatformProfile } from '../../entities/platform-profile.entity';

export interface PlatformEntry {
  platform: string;
  handle: string;
  displayName: string;
  total: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(PlatformProfile)
    private platformRepository: Repository<PlatformProfile>,
  ) {}

  async getSummary(organizationId: number, days: number = 30) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const totalPosts = await this.postRepository.count({
      where: { organizationId },
    });

    const publishedThisPeriod = await this.postRepository.count({
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

    const drafts = await this.postRepository.count({
      where: {
        organizationId,
        status: 'draft',
      },
    });

    const failed = await this.postRepository.count({
      where: {
        organizationId,
        status: 'failed',
      },
    });

    const profiles = await this.platformRepository.find({
      where: { organizationId },
    });

    const byPlatform: PlatformEntry[] = [];
    for (const profile of profiles) {
      const total = await this.postRepository.count({
        where: { organizationId, platformProfileId: profile.id },
      });
      byPlatform.push({
        platform: profile.platform,
        handle: profile.handle,
        displayName: profile.displayName,
        total,
      });
    }

    const recentPosts = await this.postRepository.find({
      where: { organizationId, status: 'published' },
      relations: { platformProfile: true },
      order: { publishedAt: 'DESC' },
      take: 5,
    });

    return {
      kpi: {
        totalPosts,
        publishedThisPeriod,
        scheduled,
        drafts,
        failed,
      },
      byPlatform,
      recentPosts,
      periodDays: days,
    };
  }
}
