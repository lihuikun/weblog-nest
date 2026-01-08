import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateEmailPushDto {
  @ApiProperty({
    description: '是否接收每日文章邮件推送',
    example: true,
  })
  @IsBoolean({ message: '必须是布尔值' })
  receiveArticleEmail: boolean;
}
