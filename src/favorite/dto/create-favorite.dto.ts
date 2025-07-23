import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateFavoriteDto {
  @ApiProperty({ description: '面试题ID' })
  @IsNumber()
  interviewId: number;
}
