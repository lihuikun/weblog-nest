import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    senderId: number;

    @Column({ nullable: true })
    receiverId: number | null;

    @Column('text')
    content: string;

    @Column({ default: false })
    isBroadcast: boolean; // ✨ 是否为广播消息

    @Column({
        type: 'enum',
        enum: ['system', 'notification', 'private'],
        default: 'notification',
    })
    type: 'system' | 'notification' | 'private';

    @Column({ nullable: true })
    redirectUrl: string; // ✨ 可选：点击跳转链接（前端根据此跳转）

    @Column({ default: false })
    isRead: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
