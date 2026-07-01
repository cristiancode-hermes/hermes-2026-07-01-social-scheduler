import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity('post_versions')
@Unique(['postId', 'versionNumber'])
export class PostVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'post_id' })
  postId: number;

  @ManyToOne(() => Post, (post) => post.versions)
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', name: 'media_asset_id', nullable: true })
  mediaAssetId: number | null;

  @Column({ type: 'text', name: 'change_description', nullable: true })
  changeDescription: string | null;

  @Column({ name: 'version_number' })
  versionNumber: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
