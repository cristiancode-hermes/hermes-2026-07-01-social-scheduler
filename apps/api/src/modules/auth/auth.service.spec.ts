import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { RegisterDto } from './register.dto';
import { LoginDto } from './login.dto';

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$hashed'),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let organizationRepository: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: {
    sign: jest.Mock;
  };

  const mockUser = {
    id: 1,
    organizationId: 1,
    name: 'Ana Martínez',
    email: 'ana@techcorp.com',
    password: '$2a$10$hashed',
    role: 'admin',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    organization: {
      id: 1,
      name: 'TechCorp',
      slug: 'techcorp',
      createdAt: new Date('2025-01-01T00:00:00Z'),
    },
  };

  const mockOrg = {
    id: 1,
    name: 'TechCorp',
    slug: 'techcorp',
    createdAt: new Date('2025-01-01T00:00:00Z'),
  };

  const registerDto: RegisterDto = {
    name: 'Ana Martínez',
    email: 'ana@techcorp.com',
    password: 'password123',
    organizationName: 'TechCorp',
  };

  const loginDto: LoginDto = {
    email: 'ana@techcorp.com',
    password: 'password123',
  };

  const expectedToken = 'jwt-token';

  beforeEach(async () => {
    jest.clearAllMocks();

    userRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    organizationRepository = {
      create: jest.fn(),
      save: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue(expectedToken),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Organization),
          useValue: organizationRepository,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should create an organization and user, then return token and user info', async () => {
      userRepository.findOne.mockResolvedValue(null);
      organizationRepository.create.mockReturnValue(mockOrg);
      organizationRepository.save.mockResolvedValue(mockOrg);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });

      expect(organizationRepository.create).toHaveBeenCalledWith({
        name: 'TechCorp',
        slug: 'techcorp',
      });
      expect(organizationRepository.save).toHaveBeenCalledWith(mockOrg);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);

      expect(userRepository.create).toHaveBeenCalledWith({
        name: 'Ana Martínez',
        email: 'ana@techcorp.com',
        password: '$2a$10$hashed',
        organization: { id: 1 },
        role: 'admin',
      });
      expect(userRepository.save).toHaveBeenCalledWith(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'ana@techcorp.com',
        organizationId: 1,
        role: 'admin',
      });

      expect(result).toEqual({
        token: 'jwt-token',
        user: {
          id: 1,
          name: 'Ana Martínez',
          email: 'ana@techcorp.com',
          role: 'admin',
          organizationId: 1,
          organizationName: 'TechCorp',
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        'Email already registered',
      );

      expect(organizationRepository.create).not.toHaveBeenCalled();
      expect(organizationRepository.save).not.toHaveBeenCalled();
      expect(userRepository.create).not.toHaveBeenCalled();
      expect(userRepository.save).not.toHaveBeenCalled();
    });

    it('should generate a slug from organization name', async () => {
      userRepository.findOne.mockResolvedValue(null);
      const dtoWithSpecialChars: RegisterDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        organizationName: 'My Awesome Org!!!',
      };

      const expectedSlugOrg = {
        ...mockOrg,
        name: 'My Awesome Org!!!',
        slug: 'my-awesome-org',
      };

      organizationRepository.create.mockReturnValue(expectedSlugOrg);
      organizationRepository.save.mockResolvedValue(expectedSlugOrg);
      userRepository.create.mockReturnValue(mockUser);
      userRepository.save.mockResolvedValue(mockUser);

      await service.register(dtoWithSpecialChars);

      expect(organizationRepository.create).toHaveBeenCalledWith({
        name: 'My Awesome Org!!!',
        slug: 'my-awesome-org',
      });
    });
  });

  describe('login', () => {
    it('should return token and user info on valid credentials', async () => {
      const userWithPassword = { ...mockUser, password: '$2a$10$hashed' };
      userRepository.findOne.mockResolvedValue(userWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          role: true,
          organizationId: true,
        },
        relations: { organization: true },
      });

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        '$2a$10$hashed',
      );

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 1,
        email: 'ana@techcorp.com',
        organizationId: 1,
        role: 'admin',
      });

      expect(result).toEqual({
        token: 'jwt-token',
        user: {
          id: 1,
          name: 'Ana Martínez',
          email: 'ana@techcorp.com',
          role: 'admin',
          organizationId: 1,
          organizationName: 'TechCorp',
        },
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      const userWithPassword = { ...mockUser, password: '$2a$10$hashed' };
      userRepository.findOne.mockResolvedValue(userWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        '$2a$10$hashed',
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return user info with organization name', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getMe(1);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { organization: true },
      });

      expect(result).toEqual({
        id: 1,
        name: 'Ana Martínez',
        email: 'ana@techcorp.com',
        role: 'admin',
        organizationId: 1,
        organizationName: 'TechCorp',
        createdAt: mockUser.createdAt,
      });
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getMe(999)).rejects.toThrow(UnauthorizedException);
      await expect(service.getMe(999)).rejects.toThrow('User not found');
    });

    it('should handle user without organization relation gracefully', async () => {
      const userWithoutOrg = { ...mockUser, organization: undefined };
      userRepository.findOne.mockResolvedValue(userWithoutOrg);

      const result = await service.getMe(1);

      expect(result.organizationId).toBe(1);
      expect(result.organizationName).toBeUndefined();
    });
  });
});
