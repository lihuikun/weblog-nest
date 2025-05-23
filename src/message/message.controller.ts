import { Controller, Post, Body, Get, Param, Patch, Request, Delete, Query } from '@nestjs/common';
import { MessageService } from './message.service';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { ApiBody, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { Pagination, PaginationParams } from 'src/common/decorators/pagination.decorator';
import { RequireRole, CurrentUserId } from 'src/common/decorators/require-role.decorator';
import { Role } from 'src/user/entities/user.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('messages')
export class MessageController {
    constructor(private readonly messageService: MessageService) { }

    @Post()
    @ApiOperation({ summary: '发送消息' })
    @ApiBody({ type: SendMessageDto })
    sendMessage(@CurrentUserId() userId: number, @Body() dto: SendMessageDto) {
        return this.messageService.sendMessage(dto, userId);
    }

    @Get('unread-count')
    @ApiOperation({ summary: '获取未读消息数量' })
    getUnreadMessageCount(@CurrentUserId() userId: number) {
        return this.messageService.getUnreadMessageCount(userId);
    }

    @Get(':type')
    @ApiOperation({ summary: '获取消息列表' })
    @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
    @ApiQuery({ name: 'pageSize', required: false, description: '每页数量', example: 10 })
    getMessages(
        @CurrentUserId() userId: number,
        @Param('type') type: string,
        @Pagination() pagination: PaginationParams
    ) {
        return this.messageService.getMessagesForUser(userId, type, pagination);
    }

    @Patch('read/:messageId')
    @ApiOperation({ summary: '标记为已读' })
    markBroadcastAsRead(
        @CurrentUserId() userId: number,
        @Param('messageId') messageId: number,
    ) {
        return this.messageService.markBroadcastAsRead(userId, +messageId);
    }

    // 管理后台接口
    @Get('/all')
    @RequireRole(Role.ADMIN)
    @ApiOperation({ summary: '管理后台：获取所有消息' })
    @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
    @ApiQuery({ name: 'pageSize', required: false, description: '每页数量', example: 10 })
    @ApiQuery({ name: 'type', required: false, description: '消息类型', example: 'system' })
    getAllMessages(
        @Pagination() pagination: PaginationParams,
        @Query('type') type?: string
    ) {
        return this.messageService.getAllMessages(pagination, type);
    }

    @Patch(':messageId')
    @RequireRole(Role.ADMIN)
    @ApiOperation({ summary: '管理后台：更新消息' })
    @ApiBody({ type: UpdateMessageDto })
    updateMessage(
        @Param('messageId') messageId: number,
        @Body() dto: UpdateMessageDto
    ) {
        return this.messageService.updateMessage(+messageId, dto);
    }

    @Delete(':messageId')
    @RequireRole(Role.ADMIN)
    @ApiOperation({ summary: '管理后台：删除消息' })
    deleteMessage(
        @Param('messageId') messageId: number,
    ) {
        return this.messageService.deleteMessage(+messageId);
    }

}
