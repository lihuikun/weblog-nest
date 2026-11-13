import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { AppFeatureConfig } from './entities/feature-switch.entity';
import { FeatureSwitchController } from './feature-switch.controller';
import { FeatureSwitchService } from './feature-switch.service';

@Module({
  imports: [TypeOrmModule.forFeature([AppFeatureConfig, User])],
  controllers: [FeatureSwitchController],
  providers: [FeatureSwitchService],
  exports: [FeatureSwitchService],
})
export class FeatureSwitchModule {}
