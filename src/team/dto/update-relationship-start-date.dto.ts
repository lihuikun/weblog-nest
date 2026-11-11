import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class UpdateRelationshipStartDateDto {
  @ApiProperty({ description: '恋爱开始日期，格式 YYYY-MM-DD', example: '2024-05-20' })
  @IsDateString()
  relationshipStartDate: string;
}
