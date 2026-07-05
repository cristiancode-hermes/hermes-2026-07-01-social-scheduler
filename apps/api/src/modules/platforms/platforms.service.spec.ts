import { NotFoundException, ConflictException } from '@nestjs/common';
import { PlatformsService } from './platforms.service';
import { PlatformProfile } from '../../entities/platform-profile.entity';
import { CreatePlatformDto } from './create-platform.dto';
import { UpdatePlatformDto } from './update-platform.dto';

describe('PlatformsService', () => {
  let service: PlatformsService;
  let mockRepo: {
    find: jest.Mock<Promise<PlatformProfile[]>, [any]>;
    findOne: jest.Mock<Promise<PlatformProfile | null>, [any]>;
    create: jest.Mock<PlatformProfile, [any]>;
    save: jest.Mock<Promise<PlatformProfile>, [any]>;
    remove: jest.Mock<Promise<PlatformProfile>, [any]>;
  };

  const ORG_ID = 1;
  const PROFILE_ID = 42;

  // ---- Factory helpers ----
  const createMockProfile = (overrides: Partial<PlatformProfile> = {}): PlatformProfile =>
    ({
      id: PROFILE_ID,
      organizationId: ORG_ID,
      platform: 'twitter',
      handle: 'techcorp',
      displayName: 'TechCorp Official',
      avatarUrl: null,
      isActive: true,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      ...overrides,
    }) as PlatformProfile;

  const createMockCreateDto = (overrides: Partial<CreatePlatformDto> = {}): CreatePlatformDto => ({
    platform: 'twitter',
    handle: 'techcorp',
    displayName: 'TechCorp Official',
    ...overrides,
  });

  const createMockUpdateDto = (overrides: Partial<UpdatePlatformDto> = {}): UpdatePlatformDto => ({
    ...overrides,
  });

  beforeEach(() => {
    mockRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    service = new PlatformsService(mockRepo as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------------------------------
  // findAll
  // ------------------------------------------------------------------
  describe('findAll', () => {
    it('should return all platform profiles for the given organization', async () => {
      const profiles = [createMockProfile({ id: 1 }), createMockProfile({ id: 2 })];

      mockRepo.find.mockResolvedValue(profiles);

      const result = await service.findAll(ORG_ID);

      expect(result).toEqual(profiles);
      expect(mockRepo.find).toHaveBeenCalledTimes(1);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { organizationId: ORG_ID },
        order: { createdAt: 'DESC' },
      });
    });

    it('should return an empty array when no profiles exist', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.findAll(ORG_ID);

      expect(result).toEqual([]);
      expect(mockRepo.find).toHaveBeenCalledTimes(1);
    });
  });

  // ------------------------------------------------------------------
  // findOne
  // ------------------------------------------------------------------
  describe('findOne', () => {
    it('should return the platform profile when found', async () => {
      const profile = createMockProfile();

      mockRepo.findOne.mockResolvedValue(profile);

      const result = await service.findOne(PROFILE_ID, ORG_ID);

      expect(result).toEqual(profile);
      expect(mockRepo.findOne).toHaveBeenCalledTimes(1);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: PROFILE_ID, organizationId: ORG_ID },
      });
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(PROFILE_ID, ORG_ID)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(PROFILE_ID, ORG_ID)).rejects.toThrow(
        'Platform profile not found',
      );
    });
  });

  // ------------------------------------------------------------------
  // create
  // ------------------------------------------------------------------
  describe('create', () => {
    it('should create and return a new platform profile', async () => {
      const dto = createMockCreateDto();
      const savedProfile = createMockProfile();

      // No duplicate
      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(savedProfile);
      mockRepo.save.mockResolvedValue(savedProfile);

      const result = await service.create(dto, ORG_ID);

      expect(result).toEqual(savedProfile);
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: {
          organizationId: ORG_ID,
          platform: dto.platform,
          handle: dto.handle,
        },
      });
      expect(mockRepo.create).toHaveBeenCalledWith({
        ...dto,
        isActive: true, // default
        organization: { id: ORG_ID },
        organizationId: ORG_ID,
      });
      expect(mockRepo.save).toHaveBeenCalledWith(savedProfile);
    });

    it('should set isActive to true when not provided in dto', async () => {
      const dto = { platform: 'linkedin', handle: 'linkedincorp', displayName: 'Linked Corp' } as CreatePlatformDto;
      const savedProfile = createMockProfile({
        platform: 'linkedin',
        handle: 'linkedincorp',
        displayName: 'Linked Corp',
      });

      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(savedProfile);
      mockRepo.save.mockResolvedValue(savedProfile);

      const result = await service.create(dto, ORG_ID);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true }),
      );
      expect(result).toEqual(savedProfile);
    });

    it('should use isActive from dto when provided', async () => {
      const dto = createMockCreateDto({ isActive: false });
      const savedProfile = createMockProfile({ isActive: false });

      mockRepo.findOne.mockResolvedValue(null);
      mockRepo.create.mockReturnValue(savedProfile);
      mockRepo.save.mockResolvedValue(savedProfile);

      const result = await service.create(dto, ORG_ID);

      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false }),
      );
      expect(result).toEqual(savedProfile);
    });

    it('should throw ConflictException when a duplicate platform+handle exists', async () => {
      const dto = createMockCreateDto();
      const existing = createMockProfile();

      mockRepo.findOne.mockResolvedValue(existing);

      await expect(service.create(dto, ORG_ID)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create(dto, ORG_ID)).rejects.toThrow(
        'Platform profile with this handle already exists',
      );
      expect(mockRepo.create).not.toHaveBeenCalled();
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------
  // update
  // ------------------------------------------------------------------
  describe('update', () => {
    it('should partially update specified fields and return the updated profile', async () => {
      const existing = createMockProfile();
      const dto: UpdatePlatformDto = {
        displayName: 'Updated Name',
        isActive: false,
      };

      mockRepo.findOne.mockResolvedValue(existing);
      const updated = {
        ...existing,
        displayName: 'Updated Name',
        isActive: false,
      };
      mockRepo.save.mockResolvedValue(updated);

      const result = await service.update(PROFILE_ID, dto, ORG_ID);

      expect(result.displayName).toBe('Updated Name');
      expect(result.isActive).toBe(false);
      // Fields not in dto should remain unchanged
      expect(result.handle).toBe(existing.handle);
      expect(result.avatarUrl).toBe(existing.avatarUrl);

      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: PROFILE_ID, organizationId: ORG_ID },
      });
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: PROFILE_ID,
          displayName: 'Updated Name',
          isActive: false,
          handle: existing.handle,
        }),
      );
    });

    it('should not change fields that are undefined in dto', async () => {
      const existing = createMockProfile({ handle: 'originalHandle', displayName: 'Original Name' });
      const dto: UpdatePlatformDto = { handle: 'newHandle' };

      mockRepo.findOne.mockResolvedValue(existing);
      mockRepo.save.mockResolvedValue({ ...existing, handle: 'newHandle' });

      const result = await service.update(PROFILE_ID, dto, ORG_ID);

      expect(result.handle).toBe('newHandle');
      expect(result.displayName).toBe('Original Name'); // unchanged
      expect(mockRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ handle: 'newHandle', displayName: 'Original Name' }),
      );
    });

    it('should throw NotFoundException when updating a non-existent profile', async () => {
      const dto = createMockUpdateDto({ displayName: 'Nope' });

      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.update(PROFILE_ID, dto, ORG_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepo.save).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------
  // remove
  // ------------------------------------------------------------------
  describe('remove', () => {
    it('should delete the profile and return confirmation', async () => {
      const profile = createMockProfile();

      mockRepo.findOne.mockResolvedValue(profile);
      mockRepo.remove.mockResolvedValue(profile);

      const result = await service.remove(PROFILE_ID, ORG_ID);

      expect(result).toEqual({ deleted: true, id: PROFILE_ID });
      expect(mockRepo.findOne).toHaveBeenCalledWith({
        where: { id: PROFILE_ID, organizationId: ORG_ID },
      });
      expect(mockRepo.remove).toHaveBeenCalledWith(profile);
    });

    it('should throw NotFoundException when removing a non-existent profile', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(PROFILE_ID, ORG_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepo.remove).not.toHaveBeenCalled();
    });
  });
});
