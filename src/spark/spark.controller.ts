import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
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
  async chat(@Body() createSparkDto: CreateSparkDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.status(HttpStatus.OK);

    await this.sparkService.getChatCompletion(createSparkDto, (chunk: string) => {
      if (chunk === '[DONE]') {
        res.end();
      } else {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }
    });
  }
}