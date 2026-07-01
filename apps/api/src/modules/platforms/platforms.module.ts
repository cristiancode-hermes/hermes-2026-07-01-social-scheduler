import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformProfile } from '../../entities/platform-profile.entity';
import { PlatformsController } from './platforms.controller';
import { PlatformsService } from './platforms.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([PlatformProfile]), AuthModule],
  controllers: [PlatformsController],
  providers: [PlatformsService],
  exports: [PlatformsService],
})
export class PlatformsModule {}
