import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { PlatformProfile } from '../../entities/platform-profile.entity';
import { Post } from '../../entities/post.entity';
import { PostVersion } from '../../entities/post-version.entity';
import { MediaAsset } from '../../entities/media-asset.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PlatformProfile)
    private platformRepository: Repository<PlatformProfile>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(PostVersion)
    private postVersionRepository: Repository<PostVersion>,
    @InjectRepository(MediaAsset)
    private mediaRepository: Repository<MediaAsset>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const orgCount = await this.organizationRepository.count();
    if (orgCount > 0) {
      this.logger.log('Database already seeded, skipping...');
      return;
    }

    this.logger.log('Seeding database...');

    // 1. Create Organization
    const org = this.organizationRepository.create({
      name: 'TechCorp',
      slug: 'techcorp',
    });
    const savedOrg = await this.organizationRepository.save(org);

    // 2. Create Admin User
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminUser = this.userRepository.create({
      name: 'Ana Martínez',
      email: 'ana@techcorp.com',
      password: hashedPassword,
      role: 'admin',
      organizationId: savedOrg.id,
      organization: savedOrg as any,
    });
    const savedUser = await this.userRepository.save(adminUser);

    // 3. Create Platform Profiles
    const platforms = [
      { platform: 'twitter', handle: 'techcorp', displayName: 'TechCorp Twitter', avatarUrl: null },
      { platform: 'linkedin', handle: 'techcorp', displayName: 'TechCorp LinkedIn', avatarUrl: null },
      { platform: 'instagram', handle: 'techcorp_ig', displayName: 'TechCorp Instagram', avatarUrl: null },
      { platform: 'facebook', handle: 'techcorp', displayName: 'TechCorp Facebook', avatarUrl: null },
    ];

    const savedProfiles: PlatformProfile[] = [];
    for (const p of platforms) {
      const profile = this.platformRepository.create({
        ...p,
        isActive: true,
        organizationId: savedOrg.id,
        organization: savedOrg as any,
      });
      const saved = await this.platformRepository.save(profile);
      savedProfiles.push(saved);
    }

    // 4. Create Media Assets
    const mediaAssets = [
      { filename: 'banner-producto.jpg', originalName: 'banner-producto.jpg', mimeType: 'image/jpeg', fileSize: 245000, width: 1200, height: 630, url: '/uploads/banner-producto.jpg' },
      { filename: 'team-photo.jpg', originalName: 'team-photo.jpg', mimeType: 'image/jpeg', fileSize: 512000, width: 1920, height: 1080, url: '/uploads/team-photo.jpg' },
      { filename: 'logo-animado.gif', originalName: 'logo-animado.gif', mimeType: 'image/gif', fileSize: 128000, width: 500, height: 500, url: '/uploads/logo-animado.gif' },
    ];

    const savedMedia: MediaAsset[] = [];
    for (const m of mediaAssets) {
      const asset = this.mediaRepository.create({
        ...m,
        organizationId: savedOrg.id,
        organization: savedOrg as any,
      });
      const saved = await this.mediaRepository.save(asset);
      savedMedia.push(saved);
    }

    // 5. Create Posts (2 per platform: draft, scheduled, or published)
    const now = new Date();
    const postsData = [
      // Twitter posts
      { title: '🚀 We are launching!', content: 'Big news! TechCorp is launching our new AI-powered platform next week. Stay tuned! #TechCorp #AI #Innovation', platformIdx: 0, status: 'published', scheduledAt: null, publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), mediaIdx: null },
      { title: 'Tech Tuesday Thread', content: 'This Tech Tuesday we are sharing our engineering insights on scaling microservices. Check out the full blog post!', platformIdx: 0, status: 'scheduled', scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), publishedAt: null, mediaIdx: null },
      // LinkedIn posts
      { title: 'Company Milestone', content: 'We are proud to announce that TechCorp has reached 10,000 customers worldwide! Thank you for your trust.', platformIdx: 1, status: 'published', scheduledAt: null, publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), mediaIdx: 0 },
      { title: 'Job Opening: Senior Developer', content: 'We are hiring! Looking for a Senior Full-Stack Developer to join our growing team. Apply now!', platformIdx: 1, status: 'draft', scheduledAt: null, publishedAt: null, mediaIdx: null },
      // Instagram posts
      { title: 'Behind the Scenes', content: 'A sneak peek at our new office space! 🏢 Exciting times ahead for the TechCorp team. #OfficeLife #TechCorp', platformIdx: 2, status: 'published', scheduledAt: null, publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), mediaIdx: 1 },
      { title: 'Product Sneak Peek', content: 'Something amazing is coming soon! Can you guess what it is? 👀 #SneakPeek #ComingSoon', platformIdx: 2, status: 'scheduled', scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), publishedAt: null, mediaIdx: 2 },
      // Facebook posts
      { title: 'Community Update', content: 'Join us this Friday for a live Q&A session with our CEO! Bring your questions about the future of TechCorp.', platformIdx: 3, status: 'published', scheduledAt: null, publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), mediaIdx: null },
      { title: 'Holiday Schedule', content: 'TechCorp will be closed on July 4th. Our support team will be available via email for urgent inquiries.', platformIdx: 3, status: 'draft', scheduledAt: null, publishedAt: null, mediaIdx: null },
    ];

    const savedPosts: Post[] = [];
    for (const p of postsData) {
      const post = this.postRepository.create({
        title: p.title,
        content: p.content,
        status: p.status,
        scheduledAt: p.scheduledAt,
        publishedAt: p.publishedAt,
        characterCount: p.content.length,
        platformProfileId: savedProfiles[p.platformIdx].id,
        mediaAssetId: p.mediaIdx !== null ? savedMedia[p.mediaIdx].id : null,
        userId: savedUser.id,
        organizationId: savedOrg.id,
        user: savedUser as any,
        platformProfile: savedProfiles[p.platformIdx] as any,
      });
      const savedPost = await this.postRepository.save(post);
      savedPosts.push(savedPost);

      // Create version v1 for every post
      const version = this.postVersionRepository.create({
        postId: savedPost.id,
        content: p.content,
        mediaAssetId: p.mediaIdx !== null ? savedMedia[p.mediaIdx].id : null,
        changeDescription: 'Initial version',
        versionNumber: 1,
        userId: savedUser.id,
        post: savedPost as any,
        user: savedUser as any,
      });
      await this.postVersionRepository.save(version);
    }

    // Add version v2 for published/scheduled posts (simulate edits)
    for (const post of savedPosts) {
      if (post.status === 'published' || post.status === 'scheduled') {
        const v2 = this.postVersionRepository.create({
          postId: post.id,
          content: post.content + '\n\n[Edited: Added final call to action]',
          mediaAssetId: post.mediaAssetId,
          changeDescription: 'Added call to action',
          versionNumber: 2,
          userId: savedUser.id,
          post: post as any,
          user: savedUser as any,
        });
        await this.postVersionRepository.save(v2);
      }
    }

    this.logger.log('Database seeded successfully!');
    this.logger.log(`  Organization: ${savedOrg.name}`);
    this.logger.log(`  Admin user: ana@techcorp.com / password123`);
    this.logger.log(`  ${savedProfiles.length} platform profiles created`);
    this.logger.log(`  ${savedMedia.length} media assets created`);
    this.logger.log(`  ${savedPosts.length} posts created`);
  }
}
