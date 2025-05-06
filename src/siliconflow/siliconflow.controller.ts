// siliconflow.controller.ts
import { Controller, Post, Body, Res } from '@nestjs/common';
import { SiliconFlowService } from './siliconflow.service';
import { Response } from 'express';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreateSiliconflowDto } from './dto/create-siliconflow.dto';

@Controller('siliconflow')
export class SiliconflowController {
  constructor(private readonly siliconFlowService: SiliconFlowService) { }

  @Post('chat')
  @ApiOperation({ summary: '梦境解读' })
  @ApiBody({
    description: '梦境解读的接口',
    type: CreateSiliconflowDto,
  })
  async chat(@Body() createSiliconflowDto: CreateSiliconflowDto) {
    return await this.siliconFlowService.getChatCompletion(createSiliconflowDto);
  }
}
