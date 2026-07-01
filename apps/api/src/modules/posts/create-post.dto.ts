import { IsString, IsOptional, IsInt, IsDateString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @ApiProperty({ example: 'New Product Launch' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Check out our amazing new product!' })
  @IsString()
  content: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  platformProfileId: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  mediaAssetId?: number;

  @ApiPropertyOptional({ example: 'scheduled' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2026-07-15T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
