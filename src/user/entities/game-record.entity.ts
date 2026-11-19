import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/** 小游戏完整存档：与用户一对一独立存储，不影响 User 表及其它平台的查询。 */
@Entity()
export class GameRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', unique: true })
  userId: number;

  @Column({ type: 'json' })
  data: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  createTime?: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedTime?: Date;
}
