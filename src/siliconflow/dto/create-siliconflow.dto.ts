import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';
export class CreateSiliconflowDto {
    @ApiProperty({ description: '提问ai的内容', example: '我梦见自己在一个黑暗的森林里，周围都是高大的树木，我感到非常害怕。”心情记录：“醒来后感觉非常害怕，不知道该怎么办。', required: true })
    @IsString()
    @IsNotEmpty()
    @Length(1, 1000)
    userInput: string;
}
