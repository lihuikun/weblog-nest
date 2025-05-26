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
    UsePipes,
    Res,
    Sse,
    MessageEvent
} from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import { DreamService } from './dream.service';
import { CreateDreamDto } from './dto/create-dream.dto';
import { UpdateDreamDto } from './dto/update-dream.dto';
import { AnalyzeDreamDto } from './dto/analyze-dream.dto';
import { AuthGuard } from '../auth/auth.guard';
import { SensitivePipe } from '../common/pipes/sensitive.pipe';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
} from '@nestjs/swagger';
import { Pagination, PaginationParams } from 'src/common/decorators/pagination.decorator';
import { Observable, Subject, fromEvent, interval } from 'rxjs';
import { map } from 'rxjs/operators';

@ApiTags('梦境记录')
@Controller('dream')
@ApiBearerAuth()
export class DreamController {
    constructor(private readonly dreamService: DreamService) { }

    @Post()
    @ApiOperation({ summary: '创建梦境记录' })
    @ApiResponse({ status: 201, description: '创建成功' })
    @UseGuards(AuthGuard)
    @UsePipes(SensitivePipe)
    create(
        @Body() createDreamDto: CreateDreamDto,
        @Request() req: ExpressRequest,
    ) {
        const userId = req.user.userId;
        return this.dreamService.create(createDreamDto, userId);
    }

    @Get()
    @ApiOperation({ summary: '获取梦境大厅的所有梦境记录' })
    @ApiResponse({ status: 200, description: '获取成功' })
    @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
    @ApiQuery({ name: 'pageSize', required: false, description: '每页数量', example: 10 })
    findAll(@Pagination() pagination: PaginationParams) {
        return this.dreamService.findAll(true, pagination.page, pagination.pageSize);
    }

    @Get('my')
    @ApiOperation({ summary: '获取当前用户的所有梦境记录' })
    @ApiResponse({ status: 200, description: '获取成功' })
    @UseGuards(AuthGuard)
    @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
    @ApiQuery({ name: 'pageSize', required: false, description: '每页数量', example: 10 })
    findMy(@Request() req: ExpressRequest, @Pagination() pagination: PaginationParams) {
        const userId = req.user.userId;
        return this.dreamService.findMy(userId, pagination.page, pagination.pageSize);
    }

    @Get(':id')
    @ApiOperation({ summary: '获取指定梦境记录' })
    @ApiResponse({ status: 200, description: '获取成功' })
    @UseGuards(AuthGuard)
    findOne(@Param('id') id: string, @Request() req: ExpressRequest) {
        const userId = req.user.userId;
        return this.dreamService.findOne(+id, userId);
    }

    @Patch(':id')
    @ApiOperation({ summary: '更新梦境记录' })
    @ApiResponse({ status: 200, description: '更新成功' })
    @UsePipes(SensitivePipe)
    @UseGuards(AuthGuard)
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
    @UseGuards(AuthGuard)
    remove(@Param('id') id: string, @Request() req: ExpressRequest) {
        const userId = req.user.userId;
        return this.dreamService.remove(+id, userId);
    }

    @Sse('analyze/:id')
    @ApiOperation({ summary: 'AI分析梦境（SSE流式输出）' })
    @ApiResponse({ status: 200, description: '分析成功' })
    analyzeStream(
        @Param('id') id: string,
        @Param('userId') userId: number
    ): Observable<MessageEvent> {
        const messageSubject = new Subject<MessageEvent>();

        // 使用流式分析方法，传入chunk处理回调
        this.dreamService.analyzeWithAIStream(+id, userId, (chunk: string) => {
            if (chunk === '[DONE]') {
                messageSubject.next({ data: { done: true } });
                messageSubject.complete();
            } else {
                messageSubject.next({ data: { content: chunk } });
            }
        }).catch(error => {
            console.error('AI分析失败:', error);
            messageSubject.next({ data: { error: error.message } });
            messageSubject.complete();
        });

        return messageSubject.asObservable();
    }

    @Sse('test/:id')
    testStream(@Param('id') id: string): Observable<MessageEvent> {
        return interval(1000).pipe(
            map(i => ({ data: { content: `测试消息 ${i}` } }))
        );
    }
}
