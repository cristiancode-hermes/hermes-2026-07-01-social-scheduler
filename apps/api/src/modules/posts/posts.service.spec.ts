import { NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from '../../entities/post.entity';
import { PostVersion } from '../../entities/post-version.entity';
import { User } from '../../entities/user.entity';
import { CreatePostDto } from './create-post.dto';
import { UpdatePostDto } from './update-post.dto';
import { QueryPostDto } from './query-post.dto';

/* ------------------------------------------------------------------ */
/*  Factory helpers — fresh objects each call to avoid cross-test      */
/*  mutation via Object.assign pollution.                              */
/* ------------------------------------------------------------------ */
function makePost(overrides: Partial<Post> = {}): Post {
  const post = new Post();
  Object.assign(post, {
    id: 1,
    organizationId: 1,
    userId: 10,
    title: 'Test Post',
    content: 'Test content',
    status: 'draft',
    scheduledAt: null,
    publishedAt: null,
    platformProfileId: 5,
    mediaAssetId: null,
    characterCount: 12,
    createdAt: new Date('2026-06-01T00:00:00Z'),
    updatedAt: new Date('2026-06-01T00:00:00Z'),
    versions: [],
    platformProfile: { id: 5, platform: 'twitter' } as any,
    user: { id: 10, name: 'Alice', email: 'alice@test.com' } as any,
    mediaAsset: null,
    ...overrides,
  });
  return post;
}

function makeVersion(overrides: Partial<PostVersion> = {}): PostVersion {
  const v = new PostVersion();
  Object.assign(v, {
    id: 1,
    postId: 1,
    content: 'Test content',
    mediaAssetId: null,
    changeDescription: 'Initial version',
    versionNumber: 1,
    userId: 10,
    createdAt: new Date('2026-06-01T00:00:00Z'),
    post: { id: 1 } as Post,
    user: { id: 10, name: 'Alice' } as User,
    ...overrides,
  });
  return v;
}

function makeUser(overrides: Partial<User> = {}): User {
  const u = new User();
  Object.assign(u, {
    id: 10,
    organizationId: 1,
    name: 'Alice',
    email: 'alice@test.com',
    role: 'admin',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });
  return u;
}

/* ------------------------------------------------------------------ */
/*  Query helper — plain object (dto instances not required by the     */
/*  service as it reads props directly).                               */
/* ------------------------------------------------------------------ */
function q(overrides: Partial<QueryPostDto> = {}): QueryPostDto {
  return { page: 1, limit: 20, ...overrides } as QueryPostDto;
}

/* ------------------------------------------------------------------ */
/*  Suite                                                              */
/* ------------------------------------------------------------------ */
describe('PostsService', () => {
  let service: PostsService;
  let mockPostRepo: Record<string, jest.Mock>;
  let mockVersionRepo: Record<string, jest.Mock>;
  let mockUserRepo: Record<string, jest.Mock>;

  const orgId = 1;

  beforeEach(() => {
    mockPostRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
    };
    mockVersionRepo = {
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };
    mockUserRepo = {
      findOne: jest.fn(),
    };

    service = new PostsService(
      mockPostRepo as any,
      mockVersionRepo as any,
      mockUserRepo as any,
    );
  });

  /* ------------------------------------------------------------------ */
  /*  findAll                                                           */
  /* ------------------------------------------------------------------ */
  describe('findAll', () => {
    it('returns a paginated list of posts', async () => {
      const posts = [makePost({ id: 1 }), makePost({ id: 2 })];
      mockPostRepo.findAndCount.mockResolvedValue([posts, 2]);

      const result = await service.findAll(q(), orgId);

      expect(result).toEqual({
        data: posts,
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockPostRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId },
          skip: 0,
          take: 20,
        }),
      );
    });

    it('filters by platform', async () => {
      const posts = [makePost({ id: 3 })];
      mockPostRepo.findAndCount.mockResolvedValue([posts, 1]);

      const result = await service.findAll(q({ platform: 'twitter' }), orgId);

      expect(result.data).toEqual(posts);
      expect(mockPostRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            organizationId: orgId,
            platformProfile: { platform: 'twitter' },
          },
        }),
      );
    });

    it('filters by status', async () => {
      const posts = [makePost({ id: 4, status: 'published' })];
      mockPostRepo.findAndCount.mockResolvedValue([posts, 1]);

      const result = await service.findAll(q({ status: 'published' }), orgId);

      expect(result.data).toEqual(posts);
      expect(mockPostRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId, status: 'published' },
        }),
      );
    });

    it('filters by month and year using Between', async () => {
      const posts = [makePost({ id: 5 })];
      mockPostRepo.findAndCount.mockResolvedValue([posts, 1]);

      const result = await service.findAll(q({ month: 7, year: 2026 }), orgId);

      expect(result.data).toEqual(posts);
      const callArg = (mockPostRepo.findAndCount as jest.Mock).mock.calls[0][0];
      expect(callArg.where).toHaveProperty('scheduledAt');
      // Between is a special TypeORM object — just verify it was used
      expect(callArg.where.organizationId).toBe(orgId);
    });

    it('performs text search with q param and deduplicates', async () => {
      // Same post matched twice (title + content match) – should deduplicate
      const duplicated = makePost({ id: 10, title: 'hello world', content: 'hello world content' });
      mockPostRepo.findAndCount.mockResolvedValue([[duplicated, duplicated], 2]);

      const result = await service.findAll(q({ q: 'hello' }), orgId);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(10);
      // After dedup the total should equal data length
      expect(result.total).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it('respects custom page and limit', async () => {
      mockPostRepo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(q({ page: 3, limit: 10 }), orgId);

      expect(mockPostRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('returns empty result when no posts match', async () => {
      mockPostRepo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(q(), orgId);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /*  findOne                                                           */
  /* ------------------------------------------------------------------ */
  describe('findOne', () => {
    it('returns a post with all relations', async () => {
      const post = makePost({
        versions: [makeVersion({ versionNumber: 2 }), makeVersion({ versionNumber: 1 })],
      });
      mockPostRepo.findOne.mockResolvedValue(post);

      const result = await service.findOne(1, orgId);

      expect(result).toEqual(post);
      expect(mockPostRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1, organizationId: orgId },
          relations: {
            platformProfile: true,
            user: true,
            mediaAsset: true,
            versions: { user: true },
          },
        }),
      );
    });

    it('throws NotFoundException when post does not exist', async () => {
      mockPostRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(999, orgId)).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when post belongs to a different organization', async () => {
      mockPostRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne(1, 42)).rejects.toThrow(NotFoundException);
    });
  });

  /* ------------------------------------------------------------------ */
  /*  create                                                            */
  /* ------------------------------------------------------------------ */
  describe('create', () => {
    const dto: CreatePostDto = {
      title: 'New Post',
      content: 'Fresh content here',
      platformProfileId: 5,
      scheduledAt: '2026-07-15T10:00:00Z',
      mediaAssetId: 3,
      status: 'scheduled',
    };

    it('creates a post and an initial version', async () => {
      const user = makeUser();
      mockUserRepo.findOne.mockResolvedValue(user);

      const savedPost = makePost({
        id: 42,
        title: dto.title,
        content: dto.content,
        platformProfileId: 5,
        mediaAssetId: 3,
        status: 'scheduled',
        scheduledAt: new Date('2026-07-15T10:00:00Z'),
        characterCount: 18,
      });

      mockPostRepo.create.mockReturnValue(savedPost);
      mockPostRepo.save.mockResolvedValue(savedPost);
      mockPostRepo.findOne.mockResolvedValue(savedPost); // for findOne after create

      const versionEntity = makeVersion({ postId: 42, versionNumber: 1 });
      mockVersionRepo.create.mockReturnValue(versionEntity);
      mockVersionRepo.save.mockResolvedValue(versionEntity);

      const result = await service.create(dto, 10, orgId);

      expect(result).toEqual(savedPost);
      expect(mockUserRepo.findOne).toHaveBeenCalledWith({ where: { id: 10 } });
      expect(mockPostRepo.create).toHaveBeenCalledWith({
        title: 'New Post',
        content: 'Fresh content here',
        platformProfileId: 5,
        mediaAssetId: 3,
        status: 'scheduled',
        scheduledAt: expect.any(Date),
        characterCount: 18,
        organizationId: orgId,
        userId: 10,
        user: { id: 10 },
      });
      expect(mockPostRepo.save).toHaveBeenCalledWith(savedPost);
      expect(mockVersionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: 42,
          content: 'Fresh content here',
          versionNumber: 1,
          changeDescription: 'Initial version',
          userId: 10,
        }),
      );
      expect(mockVersionRepo.save).toHaveBeenCalledWith(versionEntity);
    });

    it('uses default status "draft" when not provided', async () => {
      const minimalDto: CreatePostDto = {
        title: 'Minimal',
        content: 'Hello',
        platformProfileId: 1,
      };
      const user = makeUser();
      mockUserRepo.findOne.mockResolvedValue(user);

      const savedPost = makePost({ id: 7, title: 'Minimal', content: 'Hello', status: 'draft' });
      mockPostRepo.create.mockReturnValue(savedPost);
      mockPostRepo.save.mockResolvedValue(savedPost);
      mockPostRepo.findOne.mockResolvedValue(savedPost);

      const versionEntity = makeVersion({ postId: 7 });
      mockVersionRepo.create.mockReturnValue(versionEntity);
      mockVersionRepo.save.mockResolvedValue(versionEntity);

      const result = await service.create(minimalDto, 10, orgId);

      expect(mockPostRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'draft' }),
      );
      expect(result.status).toBe('draft');
    });

    it('throws NotFoundException when user does not exist', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 999, orgId)).rejects.toThrow(NotFoundException);
      expect(mockPostRepo.create).not.toHaveBeenCalled();
    });
  });

  /* ------------------------------------------------------------------ */
  /*  update                                                            */
  /* ------------------------------------------------------------------ */
  describe('update', () => {
    it('updates post fields and creates a new version when content changes', async () => {
      const existingPost = makePost({
        id: 1,
        content: 'Original content',
        characterCount: 16,
        versions: [makeVersion({ versionNumber: 1 })],
      });
      const updatedPost = makePost({
        id: 1,
        content: 'Updated content',
        characterCount: 15,
        title: 'Updated Title',
        versions: [makeVersion({ versionNumber: 1 })],
      });
      // findOne is called twice: once inside update() and once via return this.findOne()
      mockPostRepo.findOne
        .mockResolvedValueOnce(existingPost)
        .mockResolvedValueOnce(updatedPost);
      mockPostRepo.save.mockResolvedValue(updatedPost);

      const versionEntity = makeVersion({ postId: 1, versionNumber: 2, content: 'Updated content' });
      mockVersionRepo.create.mockReturnValue(versionEntity);
      mockVersionRepo.save.mockResolvedValue(versionEntity);

      const dto: UpdatePostDto = { title: 'Updated Title', content: 'Updated content' };

      const result = await service.update(1, dto, 10, orgId);

      expect(result.content).toBe('Updated content');
      expect(mockPostRepo.save).toHaveBeenCalled();
      expect(mockVersionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: 1,
          content: 'Updated content',
          versionNumber: 2,
          changeDescription: 'Content updated',
          userId: 10,
        }),
      );
      expect(mockVersionRepo.save).toHaveBeenCalledWith(versionEntity);
    });

    it('does not create a version when content is unchanged', async () => {
      const existingPost = makePost({
        id: 1,
        content: 'Same content',
        versions: [makeVersion({ versionNumber: 1 })],
      });
      const savedPost = { ...existingPost, title: 'Only title changed' };
      mockPostRepo.findOne
        .mockResolvedValueOnce(existingPost)
        .mockResolvedValueOnce(savedPost);
      mockPostRepo.save.mockResolvedValue(savedPost);

      const dto: UpdatePostDto = { title: 'Only title changed' };

      const result = await service.update(1, dto, 10, orgId);

      expect(result.title).toBe('Only title changed');
      expect(mockVersionRepo.create).not.toHaveBeenCalled();
      expect(mockVersionRepo.save).not.toHaveBeenCalled();
    });

    it('updates status, mediaAssetId, platformProfileId, and scheduledAt', async () => {
      const existingPost = makePost({
        id: 1,
        content: 'Stays same',
        status: 'draft',
      });
      const updatedPost = makePost({
        id: 1,
        content: 'Stays same',
        status: 'published',
        mediaAssetId: 99,
        platformProfileId: 7,
      });
      mockPostRepo.findOne
        .mockResolvedValueOnce(existingPost)
        .mockResolvedValueOnce(updatedPost);
      mockPostRepo.save.mockResolvedValue(updatedPost);

      const dto: UpdatePostDto = {
        status: 'published',
        mediaAssetId: 99,
        platformProfileId: 7,
        scheduledAt: '2026-08-01T12:00:00Z',
      };

      const result = await service.update(1, dto, 10, orgId);

      // save gets called with the post that has updated properties
      expect(mockPostRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          mediaAssetId: 99,
          platformProfileId: 7,
        }),
      );
    });

    it('throws NotFoundException when post does not exist', async () => {
      mockPostRepo.findOne.mockResolvedValue(null);

      await expect(service.update(999, {} as UpdatePostDto, 10, orgId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  /* ------------------------------------------------------------------ */
  /*  remove                                                            */
  /* ------------------------------------------------------------------ */
  describe('remove', () => {
    it('deletes versions then the post and returns confirmation', async () => {
      const post = makePost({ id: 1 });
      mockPostRepo.findOne.mockResolvedValue(post);
      mockVersionRepo.delete.mockResolvedValue({ affected: 2, raw: {} } as any);
      mockPostRepo.remove.mockResolvedValue(post);

      const result = await service.remove(1, orgId);

      expect(result).toEqual({ deleted: true, id: 1 });
      expect(mockVersionRepo.delete).toHaveBeenCalledWith({ postId: 1 });
      expect(mockPostRepo.remove).toHaveBeenCalledWith(post);
    });

    it('throws NotFoundException when post does not exist', async () => {
      mockPostRepo.findOne.mockResolvedValue(null);

      await expect(service.remove(999, orgId)).rejects.toThrow(NotFoundException);
      expect(mockVersionRepo.delete).not.toHaveBeenCalled();
      expect(mockPostRepo.remove).not.toHaveBeenCalled();
    });
  });
});
