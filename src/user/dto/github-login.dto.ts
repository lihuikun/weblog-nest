import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateGithubLoginDto {
    @ApiProperty({ description: 'GitHub授权码' })
    @IsString()
    @IsNotEmpty()
    code: string;
    @ApiProperty({ description: 'GitHub应用类型', default: 'default' })
    @IsString()
    @IsNotEmpty()
    type: string;
}

