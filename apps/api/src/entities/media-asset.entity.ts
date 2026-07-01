import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

@Entity('media_assets')
export class MediaAsset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'organization_id' })
  organizationId: number;

  @ManyToOne(() => Organization, (org) => org.mediaAssets)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ length: 255 })
  filename: string;

  @Column({ length: 255, name: 'original_name' })
  originalName: string;

  @Column({ length: 100, name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'file_size' })
  fileSize: number;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ length: 500 })
  url: string;

  @CreateDateColumn()
  createdAt: Date;
}
