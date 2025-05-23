import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { MessageRead } from './entities/message-read.entity';
import { Repository } from 'typeorm';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PaginationParams } from 'src/common/decorators/pagination.decorator';
import { UserService } from 'src/user/user.service';

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,
        @InjectRepository(MessageRead)
        private readonly messageReadRepo: Repository<MessageRead>,
        private readonly userService: UserService,
    ) { }

    // 丰富消息数据，添加发送者信息
    private async enrichMessagesWithUserInfo(messages: Message[]) {
        // 提取所有发送者ID
        const senderIds = [...new Set(messages.map(msg => msg.senderId).filter(id => id))];

        // 批量获取用户信息
        const usersInfo = await this.userService.getUsersBasicInfo(senderIds);

        // 为每条消息添加发送者信息
        return messages.map(msg => ({
            ...msg,
            sender: usersInfo[msg.senderId] || {
                id: msg.senderId,
                nickname: '未知用户',
                avatarUrl: ''
            }
        }));
    }

    async sendMessage(dto: SendMessageDto, userId: number) {
        const message = this.messageRepo.create({
            ...dto,
            senderId: userId,
            receiverId: dto.receiverId ?? null,
            isBroadcast: !dto?.receiverId, // 没有 receiverId 默认广播
        });
        return this.messageRepo.save(message);
    }

    async getMessagesForUser(userId: number, type: string, pagination: PaginationParams) {
        const { page, pageSize } = pagination;

        const qb = this.messageRepo
            .createQueryBuilder('m')
            .leftJoin(
                MessageRead,
                'mr',
                'mr.messageId = m.id AND mr.userId = :userId',
                { userId },
            );

        // 根据类型筛选
        if (type && ['system', 'notification', 'private'].includes(type)) {
            qb.andWhere('m.type = :type', { type });
        }

        // 查询条件：用户的私信或广播消息(包括已读和未读)
        qb.andWhere(
            '(m.receiverId = :userId OR (m.isBroadcast = true))',
            { userId }
        )
            .orderBy('m.createdAt', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize);

        // 获取总数
        const total = await qb.getCount();

        // 获取分页后的消息
        const messages = await qb.getMany();

        // 补上是否已读字段
        const messagesWithReadStatus = await Promise.all(
            messages.map(async (msg) => {
                if (!msg.isBroadcast) {
                    return { ...msg, isRead: msg.isRead }; // 使用数据库中存储的已读状态
                }

                // 对于广播消息，查询是否有阅读记录
                const read = await this.messageReadRepo.findOne({
                    where: { userId, messageId: msg.id },
                });

                return {
                    ...msg,
                    isRead: !!read,
                };
            }),
        );

        // 丰富用户信息
        const enrichedMessages = await this.enrichMessagesWithUserInfo(messagesWithReadStatus);

        // 返回分页结果
        return {
            list: enrichedMessages,
            total,
            page,
            pageSize
        };
    }

    async markBroadcastAsRead(userId: number, messageId: number) {
        const exists = await this.messageReadRepo.findOne({
            where: { userId, messageId },
        });

        if (!exists) {
            const read = this.messageReadRepo.create({ userId, messageId });
            return this.messageReadRepo.save(read);
        }

        return exists;
    }

    // 获取未读消息数量
    async getUnreadMessageCount(userId: number) {
        // 获取未读私信消息数量
        const privateUnreadCount = await this.messageRepo.count({
            where: { receiverId: userId, isRead: false },
        });

        // 获取未读广播消息数量
        const broadcastMessages = await this.messageRepo
            .createQueryBuilder('m')
            .leftJoin(
                MessageRead,
                'mr',
                'mr.messageId = m.id AND mr.userId = :userId',
                { userId },
            )
            .where('m.isBroadcast = true')
            .andWhere('mr.id IS NULL')
            .getCount();

        // 返回总未读消息数量
        return privateUnreadCount + broadcastMessages;
    }

    // 更新消息 - 权限验证由装饰器处理
    async updateMessage(messageId: number, dto: UpdateMessageDto) {
        // 查找消息，确保消息存在
        const message = await this.messageRepo.findOne({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException('消息不存在');
        }

        // 过滤掉undefined的字段，只更新传入的字段
        const updateData = Object.keys(dto).reduce((acc, key) => {
            if (dto[key] !== undefined) {
                acc[key] = dto[key];
            }
            return acc;
        }, {});

        // 执行更新
        await this.messageRepo.update(messageId, updateData);

        // 返回更新后的消息
        return this.messageRepo.findOne({
            where: { id: messageId },
        });
    }

    // 管理后台：获取所有消息 - 权限验证由装饰器处理
    async getAllMessages(pagination: PaginationParams, type?: string) {
        const { page, pageSize } = pagination;

        const qb = this.messageRepo.createQueryBuilder('m');

        // 根据类型筛选
        if (type && ['system', 'notification', 'private'].includes(type)) {
            qb.where('m.type = :type', { type });
        }

        // 分页和排序
        qb.orderBy('m.createdAt', 'DESC')
            .skip((page - 1) * pageSize)
            .take(pageSize);

        // 获取总数和数据
        const [list, total] = await qb.getManyAndCount();

        // 丰富用户信息
        const enrichedMessages = await this.enrichMessagesWithUserInfo(list);

        return {
            list: enrichedMessages,
            total,
            page,
            pageSize
        };
    }

    // 管理后台：删除消息 - 权限验证由装饰器处理
    async deleteMessage(messageId: number) {
        // 查找消息，确保消息存在
        const message = await this.messageRepo.findOne({
            where: { id: messageId },
        });

        if (!message) {
            throw new NotFoundException('消息不存在');
        }

        // 删除相关的阅读记录
        await this.messageReadRepo.delete({ messageId });

        // 删除消息
        await this.messageRepo.remove(message);

        return { success: true, message: '消息删除成功' };
    }
}
