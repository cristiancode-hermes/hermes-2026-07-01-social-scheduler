import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import { PlatformProfile } from '../../entities/platform-profile.entity';
import { Post } from '../../entities/post.entity';
import { PostVersion } from '../../entities/post-version.entity';
import { MediaAsset } from '../../entities/media-asset.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      User,
      PlatformProfile,
      Post,
      PostVersion,
      MediaAsset,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
