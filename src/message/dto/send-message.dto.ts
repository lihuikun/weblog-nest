import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsIn } from 'class-validator';

export class SendMessageDto {
    @ApiProperty({ description: '发送者ID', example: 1 })
    @IsNumber()
    senderId: number;

    @ApiProperty({ description: '接收者ID', example: 2 })
    @IsNumber()
    receiverId: number; // 缺省表示广播

    @ApiProperty({ description: '消息内容', example: '你好，这是一条测试消息' })
    @IsString()
    content: string;

    @ApiProperty({ description: '跳转地址', example: 'https://www.baidu.com' })
    @IsOptional()
    @IsString()
    redirectUrl?: string; // ✨ 带跳转地址的消息

    @ApiProperty({ description: '消息类型', example: 'system' })
    @IsOptional()
    @IsIn(['system', 'notification', 'private'])
    type?: 'system' | 'notification' | 'private';
}
