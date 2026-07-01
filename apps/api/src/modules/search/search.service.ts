import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThan, Not } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { PlatformProfile } from '../../entities/platform-profile.entity';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(PlatformProfile)
    private platformRepository: Repository<PlatformProfile>,
  ) {}

  async search(organizationId: number, q: string, limit: number = 10) {
    const results: any[] = [];

    // Search posts by title
    const postsByTitle = await this.postRepository.find({
      where: { organizationId, title: Like(`%${q}%`) },
      relations: { platformProfile: true },
      take: limit,
    });

    for (const post of postsByTitle) {
      results.push({
        type: 'post',
        id: post.id,
        title: post.title,
        content: post.content.substring(0, 100),
        platform: post.platformProfile?.platform,
        status: post.status,
        scheduledAt: post.scheduledAt,
      });
    }

    // Search posts by content (only if we have room)
    if (results.length < limit) {
      const postsByContent = await this.postRepository.find({
        where: { organizationId, content: Like(`%${q}%`) },
        relations: { platformProfile: true },
        take: limit - results.length,
      });

      for (const post of postsByContent) {
        // Avoid duplicates
        if (!results.find((r) => r.type === 'post' && r.id === post.id)) {
          results.push({
            type: 'post',
            id: post.id,
            title: post.title,
            content: post.content.substring(0, 100),
            platform: post.platformProfile?.platform,
            status: post.status,
            scheduledAt: post.scheduledAt,
          });
        }
      }
    }

    // Search platforms by handle or displayName
    if (results.length < limit) {
      const platforms = await this.platformRepository.find({
        where: [
          { organizationId, handle: Like(`%${q}%`) },
          { organizationId, displayName: Like(`%${q}%`) },
        ],
        take: limit - results.length,
      });

      for (const platform of platforms) {
        results.push({
          type: 'platform',
          id: platform.id,
          platform: platform.platform,
          handle: platform.handle,
          displayName: platform.displayName,
          isActive: platform.isActive,
        });
      }
    }

    return results.slice(0, limit);
  }
}
