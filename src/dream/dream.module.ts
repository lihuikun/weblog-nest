import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DreamService } from './dream.service';
import { DreamController } from './dream.controller';
import { Dream } from './entities/dream.entity';
import { SiliconflowModule } from '../siliconflow/siliconflow.module';

@Module({
  imports: [TypeOrmModule.forFeature([Dream]), SiliconflowModule],
  controllers: [DreamController],
  providers: [DreamService],
  exports: [DreamService],
})
export class DreamModule { }
