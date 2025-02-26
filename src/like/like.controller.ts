import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LikeService } from './like.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { UpdateLikeDto } from './dto/update-like.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('like')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(
    @Req()
    req: {
      user: { userId: number };
    },
    @Body() createLikeDto: CreateLikeDto,
  ) {
    const userId = req.user.userId;
    console.log('🚀 ~ LikeController ~ userId:', userId);
    return this.likeService.toggleLike(userId, createLikeDto.articleId);
  }
}
