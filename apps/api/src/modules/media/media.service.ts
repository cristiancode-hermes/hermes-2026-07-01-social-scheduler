import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { MediaAsset } from '../../entities/media-asset.entity';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(MediaAsset)
    private mediaRepository: Repository<MediaAsset>,
  ) {
    this.uploadDir = join(process.cwd(), 'uploads');
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async findAll(organizationId: number, page = 1, limit = 20, type?: string) {
    const where: any = { organizationId };
    if (type) {
      where.mimeType = Like(`%${type}%`);
    }

    const [data, total] = await this.mediaRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, organizationId: number) {
    const asset = await this.mediaRepository.findOne({
      where: { id, organizationId },
    });
    if (!asset) {
      throw new NotFoundException('Media asset not found');
    }
    return asset;
  }

  async upload(
    file: any,
    organizationId: number,
  ) {
    if (!file) {
      throw new NotFoundException('No file provided');
    }

    const uniqueName = `${generateId()}-${file.originalname}`;
    const filePath = join(this.uploadDir, uniqueName);

    // Write the file
    writeFileSync(filePath, file.buffer);

    const asset = this.mediaRepository.create({
      filename: uniqueName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      width: null,
      height: null,
      url: `/uploads/${uniqueName}`,
      organization: { id: organizationId } as any,
      organizationId,
    });

    return this.mediaRepository.save(asset);
  }

  async remove(id: number, organizationId: number) {
    const asset = await this.findOne(id, organizationId);

    // Delete the file
    const filePath = join(this.uploadDir, asset.filename);
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath);
      }
    } catch (err) {
      this.logger.warn(`Failed to delete file: ${filePath}`, err);
    }

    await this.mediaRepository.remove(asset);
    return { deleted: true, id };
  }
}
