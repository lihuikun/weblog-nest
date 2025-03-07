import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePvDto {
  @IsNotEmpty()
  @IsString()
  totalPv: number;

  @IsNotEmpty()
  @IsString()
  todayPv: number;
}
