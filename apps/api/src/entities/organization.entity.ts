import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { PlatformProfile } from './platform-profile.entity';
import { MediaAsset } from './media-asset.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ unique: true, length: 100 })
  slug: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => User, (user) => user.organization)
  users: User[];

  @OneToMany(() => PlatformProfile, (profile) => profile.organization)
  platformProfiles: PlatformProfile[];

  @OneToMany(() => MediaAsset, (asset) => asset.organization)
  mediaAssets: MediaAsset[];
}
