import { Controller, Post, Body, Res } from '@nestjs/common';
import { SparkService } from './spark.service';
import { Response } from 'express';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { CreateSparkDto } from './dto/create-spark.dto';

@Controller('spark')
export class SparkController {
  constructor(private readonly sparkService: SparkService) { }

  @Post('chat')
  @ApiOperation({ summary: '梦境解读' })
  @ApiBody({
    description: '梦境解读的接口',
    type: CreateSparkDto,
  })
  async chat(@Body() createSparkDto: CreateSparkDto) {
    return await this.sparkService.getChatCompletion(createSparkDto);
  }

}