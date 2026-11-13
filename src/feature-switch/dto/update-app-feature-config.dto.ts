import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional } from 'class-validator';

export class UpdateAppFeatureConfigDto {
  @ApiPropertyOptional({ description: '是否上线（关闭时客户端接口返回 false）' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: '功能配置 JSON，key 可自定义',
    example: {
      plazaHomeCreateMenu: { label: '新增菜单' },
      plazaMenuAiGenerate: {
        aiBaseUrl: 'https://ai.lihk180.dpdns.org/ai',
        rewardAdUnit: 'adunit-xxx',
      },
    },
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown> | null;
}
