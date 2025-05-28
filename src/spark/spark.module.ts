import { Module } from '@nestjs/common';
import { SparkService } from './spark.service';
import { SparkController } from './spark.controller';

@Module({
  controllers: [SparkController],
  providers: [SparkService],
  exports: [SparkService]
})
export class SparkModule { }
