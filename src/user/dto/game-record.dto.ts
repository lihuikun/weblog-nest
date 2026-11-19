import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/** 小游戏完整存档结构，字段与前端本地 LocalRecords 一一对应。 */
export class GameRecordDto {
  @ApiProperty({ description: '历史最高波次' })
  @IsOptional()
  @IsInt()
  @Min(0)
  bestWave?: number;

  @ApiProperty({ description: '通关次数' })
  @IsOptional()
  @IsInt()
  @Min(0)
  victories?: number;

  @ApiProperty({ description: '累计击杀数' })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalKills?: number;

  @ApiProperty({ description: '最后一局随机种子' })
  @IsOptional()
  @IsInt()
  @Min(0)
  lastSeed?: number;

  @ApiProperty({ description: '已通关关卡 id 列表', type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  clearedLevels?: number[];

  @ApiProperty({ description: '各关最高波次', type: Object })
  @IsOptional()
  @IsObject()
  bestWaves?: Record<string, number>;

  @ApiProperty({ description: '各关通关星级', type: Object })
  @IsOptional()
  @IsObject()
  levelStars?: Record<string, number>;

  @ApiProperty({ description: '永久道具金币池' })
  @IsOptional()
  @IsInt()
  @Min(0)
  permanentCoins?: number;

  @ApiProperty({ description: '已永久解锁的塔 id 列表', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permanentUnlocked?: string[];
}
