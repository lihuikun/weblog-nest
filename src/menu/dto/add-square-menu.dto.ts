import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class AddSquareMenuDto {
  @ApiProperty({ description: '当前团队下的分类 ID（用户自选）', example: 1 })
  @IsInt()
  @Min(1)
  categoryId: number;
}
