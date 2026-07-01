import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import { RegisterDto } from './register.dto';
import { LoginDto } from './login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const slug = dto.organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const org = this.organizationRepository.create({
      name: dto.organizationName,
      slug,
    });
    const savedOrg = await this.organizationRepository.save(org);

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      organization: { id: savedOrg.id } as any,
      role: 'admin',
    });
    const savedUser = await this.userRepository.save(user);

    const payload = { sub: savedUser.id, email: savedUser.email, organizationId: savedOrg.id, role: savedUser.role };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: savedUser.id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        organizationId: savedOrg.id,
        organizationName: savedOrg.name,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
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

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, organizationId: user.organizationId, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organizationName: user.organization?.name,
      },
    };
  }

  async getMe(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: { organization: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization?.name,
      createdAt: user.createdAt,
    };
  }
}
