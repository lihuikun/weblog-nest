import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateMenuSquareHiddenDto {
  @ApiProperty({ description: '是否从菜单广场隐藏', example: true })
  @IsNotEmpty({ message: '隐藏状态不能为空' })
  @IsBoolean()
  hidden: boolean;
}
