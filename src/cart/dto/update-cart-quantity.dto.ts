import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCartQuantityDto {
  @ApiProperty({ description: '数量', example: 2 })
  @IsInt({ message: '数量必须为整数' })
  @Min(1, { message: '数量最小为1' })
  quantity: number;
}
