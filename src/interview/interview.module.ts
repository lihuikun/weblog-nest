import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewService } from './interview.service';
import { InterviewController } from './interview.controller';
import { Interview } from './entities/interview.entity';
import { User } from 'src/user/entities/user.entity';
import { RoleGuard } from 'src/common/decorators/require-role.decorator';
import { PremiumGuard } from 'src/common/decorators/require-premium.decorator';
import { LikeModule } from 'src/like/like.module';
import { FavoriteModule } from 'src/favorite/favorite.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Interview, User]),
    LikeModule,
    FavoriteModule,
  ],
  controllers: [InterviewController],
  providers: [InterviewService, RoleGuard, PremiumGuard],
})
export class InterviewModule {} 