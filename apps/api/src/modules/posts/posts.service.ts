import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, Like } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { PostVersion } from '../../entities/post-version.entity';
import { User } from '../../entities/user.entity';
import { CreatePostDto } from './create-post.dto';
import { UpdatePostDto } from './update-post.dto';
import { RescheduleDto } from './reschedule.dto';
import { QueryPostDto } from './query-post.dto';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(PostVersion)
    private postVersionRepository: Repository<PostVersion>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll(query: QueryPostDto, organizationId: number) {
    const where: any = { organizationId };

    if (query.platform) {
      where.platformProfile = { platform: query.platform };
    }
    if (query.status) {
      where.status = query.status;
    }

    // Month/year filtering
    if (query.month && query.year) {
      const startDate = new Date(query.year, query.month - 1, 1);
      const endDate = new Date(query.year, query.month, 0, 23, 59, 59);
      where.scheduledAt = Between(startDate, endDate);
    }

    // Text search
    let additionalWhere: any[] = [];
    if (query.q) {
      additionalWhere = [
        { ...where, title: Like(`%${query.q}%`) },
        { ...where, content: Like(`%${query.q}%`) },
      ];
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    let data: Post[];
    let total: number;

    if (additionalWhere.length > 0) {
      [data, total] = await this.postRepository.findAndCount({
        where: additionalWhere,
        relations: { platformProfile: true, user: true, mediaAsset: true },
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });
    } else {
      [data, total] = await this.postRepository.findAndCount({
        where,
        relations: { platformProfile: true, user: true, mediaAsset: true },
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });
    }

    // Deduplicate if text search returned duplicates (same post matching both title and content)
    if (query.q && data.length > 0) {
      const seen = new Set<number>();
      data = data.filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      // Re-count
      total = data.length;
    }

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCalendar(month: number, year: number, organizationId: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const posts = await this.postRepository.find({
      where: {
        organizationId,
        scheduledAt: Between(startDate, endDate),
      },
      relations: { platformProfile: true },
      order: { scheduledAt: 'ASC' },
    });

    const grouped: Record<string, Post[]> = {};
    for (const post of posts) {
      if (!post.scheduledAt) continue;
      const dateKey = new Date(post.scheduledAt).toISOString().split('T')[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(post);
    }

    return grouped;
  }

  async findOne(id: number, organizationId: number) {
    const post = await this.postRepository.findOne({
      where: { id, organizationId },
      relations: {
        platformProfile: true,
        user: true,
        mediaAsset: true,
        versions: { user: true },
      },
      order: { versions: { versionNumber: 'DESC' } },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async create(dto: CreatePostDto, userId: number, organizationId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const post = this.postRepository.create({
      title: dto.title,
      content: dto.content,
      platformProfileId: dto.platformProfileId,
      mediaAssetId: dto.mediaAssetId || null,
      status: dto.status || 'draft',
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      characterCount: dto.content.length,
      organizationId,
      userId,
      user: { id: userId } as any,
    });

    const savedPost = await this.postRepository.save(post);

    // Create version v1
    const version = this.postVersionRepository.create({
      postId: savedPost.id,
      post: { id: savedPost.id } as any,
      content: dto.content,
      mediaAssetId: dto.mediaAssetId || null,
      changeDescription: 'Initial version',
      versionNumber: 1,
      userId,
      user: { id: userId } as any,
    });
    await this.postVersionRepository.save(version);

    return this.findOne(savedPost.id, organizationId);
  }

  async update(id: number, dto: UpdatePostDto, userId: number, organizationId: number) {
    const post = await this.postRepository.findOne({
      where: { id, organizationId },
      relations: { versions: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const contentChanged = dto.content !== undefined && dto.content !== post.content;
    let oldContent = post.content;

    // Update fields
    if (dto.title !== undefined) post.title = dto.title;
    if (dto.content !== undefined) {
      post.content = dto.content;
      post.characterCount = dto.content.length;
    }
    if (dto.status !== undefined) post.status = dto.status;
    if (dto.mediaAssetId !== undefined) post.mediaAssetId = dto.mediaAssetId;
    if (dto.platformProfileId !== undefined) post.platformProfileId = dto.platformProfileId;
    if (dto.scheduledAt !== undefined) {
      post.scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    }

    await this.postRepository.save(post);

    // Create new version if content changed
    if (contentChanged) {
      const maxVersion = post.versions?.length
        ? Math.max(...post.versions.map((v) => v.versionNumber))
        : 0;

      const version = this.postVersionRepository.create({
        postId: post.id,
        post: { id: post.id } as any,
        content: dto.content!,
        mediaAssetId: dto.mediaAssetId !== undefined ? dto.mediaAssetId : post.mediaAssetId,
        changeDescription: 'Content updated',
        versionNumber: maxVersion + 1,
        userId,
        user: { id: userId } as any,
      });
      await this.postVersionRepository.save(version);
    }

    return this.findOne(id, organizationId);
  }

  async reschedule(id: number, dto: RescheduleDto, organizationId: number) {
    const post = await this.postRepository.findOne({
      where: { id, organizationId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    post.scheduledAt = new Date(dto.scheduledAt);
    if (post.status === 'draft') {
      post.status = 'scheduled';
    }
    await this.postRepository.save(post);

    return this.findOne(id, organizationId);
  }

  async remove(id: number, organizationId: number) {
    const post = await this.postRepository.findOne({
      where: { id, organizationId },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Delete related versions first
    await this.postVersionRepository.delete({ postId: id });
    await this.postRepository.remove(post);

    return { deleted: true, id };
  }
}
