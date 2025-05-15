import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { MessageRead } from './entities/message-read.entity';
import { Repository } from 'typeorm';
import { SendMessageDto } from './dto/send-message.dto';
import { PaginationParams } from 'src/common/decorators/pagination.decorator';

@Injectable()
export class MessageService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,
        @InjectRepository(MessageRead)
        private readonly messageReadRepo: Repository<MessageRead>,
    ) { }

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

        // 返回分页结果
        return {
            list: messagesWithReadStatus,
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
}
