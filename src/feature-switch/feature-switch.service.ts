import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateAppFeatureConfigDto } from './dto/update-app-feature-config.dto';
import { AppFeatureConfig } from './entities/feature-switch.entity';

const DEFAULT_CONFIG: Record<string, unknown> = {
  isAIBtn: true,
  isAddBtn: true,
};

@Injectable()
export class FeatureSwitchService implements OnModuleInit {
  constructor(
    @InjectRepository(AppFeatureConfig)
    private readonly configRepository: Repository<AppFeatureConfig>,
  ) {}

  async onModuleInit(): Promise<void> {
    const count = await this.configRepository.count();
    if (count === 0) {
      await this.configRepository.save(
        this.configRepository.create({
          enabled: true,
          config: DEFAULT_CONFIG,
        }),
      );
    }
  }

  private async getSingleton(): Promise<AppFeatureConfig> {
    const rows = await this.configRepository.find({
      order: { id: 'ASC' },
      take: 1,
    });
    const row = rows[0];
    if (!row) {
      throw new NotFoundException('功能配置未初始化');
    }
    return row;
  }

  /** 公开：总开关关 → false；开 → 整份 config JSON */
  async getPublicConfig(): Promise<false | Record<string, unknown>> {
    const row = await this.getSingleton();
    if (!row.enabled) {
      return false;
    }
    return row.config ?? {};
  }

  /** 管理端：含总开关与完整 JSON */
  async getManageConfig(): Promise<AppFeatureConfig> {
    return this.getSingleton();
  }

  async updateManageConfig(
    dto: UpdateAppFeatureConfigDto,
  ): Promise<AppFeatureConfig> {
    const row = await this.getSingleton();
    if (dto.enabled !== undefined) {
      row.enabled = dto.enabled;
    }
    if (dto.config !== undefined) {
      row.config = dto.config;
    }
    return this.configRepository.save(row);
  }
}
