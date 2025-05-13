import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateEmailUserDto {
    @ApiProperty({ description: '用户邮箱' })
    @IsEmail({}, { message: '请输入有效的邮箱地址' })
    @IsNotEmpty({ message: '邮箱不能为空' })
    email: string;

    @ApiProperty({ description: '用户密码' })
    @IsString({ message: '密码必须是字符串' })
    @IsNotEmpty({ message: '密码不能为空' })
    @MinLength(6, { message: '密码长度不能少于6个字符' })
    password: string;

    @ApiProperty({ description: '用户昵称', required: false })
    @IsString()
    nickname?: string;

    @ApiProperty({ description: '用户头像 URL', required: false })
    @IsString()
    avatarUrl?: string;
}