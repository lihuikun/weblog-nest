import { Controller, Post, Body, Get, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { MessageService } from './message.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';
import { Pagination, PaginationParams } from 'src/common/decorators/pagination.decorator';

@UseGuards(AuthGuard)
@Controller('messages')
export class MessageController {
    constructor(private readonly messageService: MessageService) { }

    @Post()
    @ApiOperation({ summary: '发送消息' })
    @ApiBody({ type: SendMessageDto })
    sendMessage(@Request() req: ExpressRequest, @Body() dto: SendMessageDto) {
        const userId = req.user.userId;
        return this.messageService.sendMessage(dto, userId);
    }

    @Get('unread-count')
    @ApiOperation({ summary: '获取未读消息数量' })
    getUnreadMessageCount(@Request() req: ExpressRequest) {
        const userId = req.user.userId;
        return this.messageService.getUnreadMessageCount(+userId);
    }

    @Get(':type')
    @ApiOperation({ summary: '获取消息列表' })
    @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
    @ApiQuery({ name: 'pageSize', required: false, description: '每页数量', example: 10 })
    getMessages(
        @Request() req: ExpressRequest,
        @Param('type') type: string,
        @Pagination() pagination: PaginationParams
    ) {
        const userId = req.user.userId;
        return this.messageService.getMessagesForUser(+userId, type, pagination);
    }

    @Patch('read/:messageId')
    @ApiOperation({ summary: '标记为已读' })
    markBroadcastAsRead(
        @Request() req: ExpressRequest,
        @Param('messageId') messageId: number,
    ) {
        const userId = req.user.userId;
        return this.messageService.markBroadcastAsRead(+userId, +messageId);
    }

}
