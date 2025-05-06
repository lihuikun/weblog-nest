import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { databaseConfig } from './config/database.config';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleModule } from './article/article.module';
import { FavoriteModule } from './favorite/favorite.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { LikeModule } from './like/like.module';
import { CommentModule } from './comment/comment.module';
import { UserModule } from './user/user.module';
import { HotSearchModule } from './hot-search/hot-search.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PvInterceptor } from './common/interceptors/pv.interceptor';
import { PvModule } from './pv/pv.module';
import { Pv } from './pv/entities/pv.entity';
import { DreamModule } from './dream/dream.module';
import { SiliconflowModule } from './siliconflow/siliconflow.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      ...databaseConfig,
    }),
    TypeOrmModule.forFeature([Pv]),
    JwtModule.register({
      global: true, //开启全局注册
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    AuthModule,
    ArticleModule,
    FavoriteModule,
    CategoryModule,
    LikeModule,
    CommentModule,
    UserModule,
    HotSearchModule,
    PvModule,
    DreamModule,
    SiliconflowModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PvInterceptor,
    },
  ],
})
export class AppModule { }
