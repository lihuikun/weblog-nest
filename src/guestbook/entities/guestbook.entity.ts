import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Guestbook {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nickname?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip?: string;

  @Column({ type: 'int', default: 0 })
  likeCount?: number;

  @Column({ type: 'boolean', default: false })
  isDeleted?: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createTime?: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedTime?: Date;
}

