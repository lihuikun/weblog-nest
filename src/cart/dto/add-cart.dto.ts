import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class AddCartDto {
  @ApiProperty({ description: '菜单ID', example: 1 })
  @IsInt({ message: '菜单ID必须为整数' })
  @Min(1, { message: '菜单ID必须大于0' })
  menuId: number;

  @ApiProperty({ description: '数量', required: false, example: 1, default: 1 })
  @IsInt({ message: '数量必须为整数' })
  @Min(1, { message: '数量最小为1' })
  quantity?: number = 1;
}
