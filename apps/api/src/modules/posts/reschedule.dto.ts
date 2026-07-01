import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RescheduleDto {
  @ApiProperty({ example: '2026-07-20T15:00:00Z' })
  @IsDateString()
  scheduledAt: string;
}
