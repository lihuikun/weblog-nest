import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DreamService } from './dream.service';
import { DreamController } from './dream.controller';
import { Dream } from './entities/dream.entity';
import { SiliconflowModule } from '../siliconflow/siliconflow.module';
import { UserModule } from '../user/user.module';
import { SparkModule } from '../spark/spark.module';
@Module({
  imports: [TypeOrmModule.forFeature([Dream]), SiliconflowModule, UserModule, SparkModule],
  controllers: [DreamController],
  providers: [DreamService],
  exports: [DreamService],
})
export class DreamModule { }
