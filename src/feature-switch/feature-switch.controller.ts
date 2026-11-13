import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RequireRole } from '../common/decorators/require-role.decorator';
import { Role } from '../user/entities/user.entity';
import { UpdateAppFeatureConfigDto } from './dto/update-app-feature-config.dto';
import { FeatureSwitchService } from './feature-switch.service';

@ApiTags('功能开关')
@Controller('feature-switch')
export class FeatureSwitchController {
  constructor(private readonly featureSwitchService: FeatureSwitchService) {}

  @Get()
  @ApiOperation({
    summary: '获取客户端功能配置（总开关关返回 false，开返回整份 JSON）',
  })
  async getPublic() {
    return this.featureSwitchService.getPublicConfig();
  }

  @Get('manage')
  @RequireRole(Role.ADMIN, Role.SUBADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: '管理端获取总开关与 JSON' })
  async getManage() {
    return this.featureSwitchService.getManageConfig();
  }

  @Put('manage')
  @RequireRole(Role.ADMIN, Role.SUBADMIN)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: '管理端更新总开关或 JSON' })
  @ApiBody({ type: UpdateAppFeatureConfigDto })
  async updateManage(@Body() dto: UpdateAppFeatureConfigDto) {
    return this.featureSwitchService.updateManageConfig(dto);
  }
}
