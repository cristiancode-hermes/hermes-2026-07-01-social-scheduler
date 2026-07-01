import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { MediaAsset } from '../../entities/media-asset.entity';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { AuthModule } from '../auth/auth.module';
import { memoryStorage } from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([MediaAsset]),
    MulterModule.register({
      storage: memoryStorage(),
    }),
    AuthModule,
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
