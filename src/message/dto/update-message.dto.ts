import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsIn, IsBoolean } from 'class-validator';

export class UpdateMessageDto {
    @ApiProperty({ description: '消息内容', example: '更新后的消息内容', required: false })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiProperty({ description: '跳转地址', example: 'https://www.example.com', required: false })
    @IsOptional()
    @IsString()
    redirectUrl?: string;

    @ApiProperty({ description: '消息类型', example: 'system', required: false })
    @IsOptional()
    @IsIn(['system', 'notification', 'private'])
    type?: 'system' | 'notification' | 'private';

    @ApiProperty({ description: '是否已读', example: true, required: false })
    @IsOptional()
    @IsBoolean()
    isRead?: boolean;

    @ApiProperty({ description: '是否为广播消息', example: false, required: false })
    @IsOptional()
    @IsBoolean()
    isBroadcast?: boolean;

    @ApiProperty({ description: '接收者ID', example: 2, required: false })
    @IsOptional()
    @IsNumber()
    receiverId?: number;
} 