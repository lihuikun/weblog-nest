import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { PvService } from './pv.service';
import { CreatePvDto } from './dto/create-pv.dto';

@ApiTags('PV统计')
@Controller('pv')
export class PvController {
  constructor(private pvService: PvService) {}

  @Get('total')
  @ApiOperation({ summary: '获取总PV、今日PV' })
  @ApiOkResponse({ description: '返回总PV、今日PV' })
  async getTotalPv(): Promise<CreatePvDto> {
    return this.pvService.getPvStats();
  }
}
