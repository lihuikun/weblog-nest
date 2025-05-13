import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { DreamService } from './dream.service';
import { CreateDreamDto } from './dto/create-dream.dto';
import { UpdateDreamDto } from './dto/update-dream.dto';
import { AnalyzeDreamDto } from './dto/analyze-dream.dto';
import { AuthGuard } from '../auth/auth.guard';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';

@ApiTags('梦境记录')
@Controller('dream')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class DreamController {
    constructor(private readonly dreamService: DreamService) { }

    @Post()
    @ApiOperation({ summary: '创建梦境记录' })
    @ApiResponse({ status: 201, description: '创建成功' })
    create(
        @Body() createDreamDto: CreateDreamDto,
        @Request() req: ExpressRequest,
    ) {
        const userId = req.user.userId;
        return this.dreamService.create(createDreamDto, userId);
    }

    @Get()
    @ApiOperation({ summary: '获取当前用户的所有梦境记录' })
    @ApiResponse({ status: 200, description: '获取成功' })
    findAll(@Request() req: ExpressRequest) {
        const userId = req.user.userId;
        return this.dreamService.findAll(userId);
    }

    @Get(':id')
    @ApiOperation({ summary: '获取指定梦境记录' })
    @ApiResponse({ status: 200, description: '获取成功' })
    findOne(@Param('id') id: string, @Request() req: ExpressRequest) {
        const userId = req.user.userId;
        return this.dreamService.findOne(+id, userId);
    }

    @Patch(':id')
    @ApiOperation({ summary: '更新梦境记录' })
    @ApiResponse({ status: 200, description: '更新成功' })
    update(
        @Param('id') id: string,
        @Body() updateDreamDto: UpdateDreamDto,
        @Request() req: ExpressRequest,
    ) {
        const userId = req.user.userId;
        return this.dreamService.update(+id, updateDreamDto, userId);
    }

    @Delete(':id')
    @ApiOperation({ summary: '删除梦境记录' })
    @ApiResponse({ status: 200, description: '删除成功' })
    remove(@Param('id') id: string, @Request() req: ExpressRequest) {
        const userId = req.user.userId;
        return this.dreamService.remove(+id, userId);
    }

    @Post(':id/analyze')
    @ApiOperation({ summary: 'AI分析梦境' })
    @ApiResponse({ status: 200, description: '分析成功' })
    analyze(
        @Param('id') id: string,
        @Request() req: ExpressRequest,
    ) {
        const userId = req.user.userId;
        return this.dreamService.analyzeWithAI(+id, userId);
    }
}
