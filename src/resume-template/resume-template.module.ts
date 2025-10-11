import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumeTemplateService } from './resume-template.service';
import { ResumeTemplateController } from './resume-template.controller';
import { ResumeTemplate } from './entities/resume-template.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ResumeTemplate, User])],
  controllers: [ResumeTemplateController],
  providers: [ResumeTemplateService],
  exports: [ResumeTemplateService],
})
export class ResumeTemplateModule {}
