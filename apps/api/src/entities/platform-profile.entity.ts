import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Post } from './post.entity';

@Entity('platform_profiles')
@Unique(['organizationId', 'platform', 'handle'])
export class PlatformProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @ManyToOne(() => Organization, (org) => org.platformProfiles)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ length: 50 })
  platform: string; // twitter|linkedin|instagram|facebook

  @Column({ length: 255 })
  handle: string;

  @Column({ length: 255, name: 'display_name' })
  displayName: string;

  @Column({ type: 'varchar', length: 500, name: 'avatar_url', nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Post, (post) => post.platformProfile)
  posts: Post[];
}
