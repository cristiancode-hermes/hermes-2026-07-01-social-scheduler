import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { PlatformProfile } from './platform-profile.entity';
import { MediaAsset } from './media-asset.entity';
import { PostVersion } from './post-version.entity';

@Entity('posts')
@Index(['organizationId', 'scheduledAt'])
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'platform_profile_id' })
  platformProfileId: number;

  @ManyToOne(() => PlatformProfile, (profile) => profile.posts)
  @JoinColumn({ name: 'platform_profile_id' })
  platformProfile: PlatformProfile;

  @Column({ type: 'int', name: 'media_asset_id', nullable: true })
  mediaAssetId: number | null;

  @ManyToOne(() => MediaAsset, { nullable: true })
  @JoinColumn({ name: 'media_asset_id' })
  mediaAsset: MediaAsset | null;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ length: 20, default: 'draft' })
  status: string; // draft|scheduled|published|failed

  @Column({ name: 'scheduled_at', nullable: true, type: 'timestamp' })
  scheduledAt: Date | null;

  @Column({ name: 'published_at', nullable: true, type: 'timestamp' })
  publishedAt: Date | null;

  @Column({ name: 'character_count', default: 0 })
  characterCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PostVersion, (version) => version.post)
  versions: PostVersion[];
}
