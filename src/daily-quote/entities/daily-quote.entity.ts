import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Unique } from 'typeorm';

@Entity('daily_quote')
@Unique(['date']) // 确保每天只有一条
export class DailyQuote {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'date' })
    date: string; // 例如 2025-05-15

    @Column({ type: 'text' })
    img: string;

    @Column({ type: 'text' })
    tts: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ type: 'text' })
    note: string;

    @CreateDateColumn()
    created_at: Date;
}