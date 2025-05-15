import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('message_reads')
@Index(['userId', 'messageId'], { unique: true })
export class MessageRead {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column()
    messageId: number;

    @CreateDateColumn()
    readAt: Date;
}
