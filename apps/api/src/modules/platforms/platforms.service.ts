import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformProfile } from '../../entities/platform-profile.entity';
import { CreatePlatformDto } from './create-platform.dto';
import { UpdatePlatformDto } from './update-platform.dto';

@Injectable()
export class PlatformsService {
  constructor(
    @InjectRepository(PlatformProfile)
    private platformRepository: Repository<PlatformProfile>,
  ) {}

  async findAll(organizationId: number) {
    return this.platformRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, organizationId: number) {
    const profile = await this.platformRepository.findOne({
      where: { id, organizationId },
    });
    if (!profile) {
      throw new NotFoundException('Platform profile not found');
    }
    return profile;
  }

  async create(dto: CreatePlatformDto, organizationId: number) {
    // Check for duplicate
    const existing = await this.platformRepository.findOne({
      where: { organizationId, platform: dto.platform, handle: dto.handle },
    });
    if (existing) {
      throw new ConflictException('Platform profile with this handle already exists');
    }

    const profile = this.platformRepository.create({
      ...dto,
      isActive: dto.isActive ?? true,
      organization: { id: organizationId } as any,
      organizationId,
    });
    return this.platformRepository.save(profile);
  }

  async update(id: number, dto: UpdatePlatformDto, organizationId: number) {
    const profile = await this.findOne(id, organizationId);

    if (dto.handle !== undefined) profile.handle = dto.handle;
    if (dto.displayName !== undefined) profile.displayName = dto.displayName;
    if (dto.avatarUrl !== undefined) profile.avatarUrl = dto.avatarUrl;
    if (dto.isActive !== undefined) profile.isActive = dto.isActive;

    return this.platformRepository.save(profile);
  }

  async remove(id: number, organizationId: number) {
    const profile = await this.findOne(id, organizationId);
    await this.platformRepository.remove(profile);
    return { deleted: true, id };
  }
}
