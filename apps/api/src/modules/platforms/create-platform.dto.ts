import { IsString, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlatformDto {
  @ApiProperty({ example: 'twitter', enum: ['twitter', 'linkedin', 'instagram', 'facebook'] })
  @IsString()
  platform: string;

  @ApiProperty({ example: 'techcorp' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  handle: string;

  @ApiProperty({ example: 'TechCorp Official' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  displayName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
