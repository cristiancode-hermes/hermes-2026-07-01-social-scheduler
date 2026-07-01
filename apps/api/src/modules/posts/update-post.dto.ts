import { IsString, IsOptional, IsInt, IsDateString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdatePostDto {
  @ApiPropertyOptional({ example: 'Updated Title' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated content here' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'published' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  mediaAssetId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  platformProfileId?: number;

  @ApiPropertyOptional({ example: '2026-07-20T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
