import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('coze_workflow')
export class CozeWorkflow {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'longtext' })
  data: string; // 工作流返回的数据

  @Column({ type: 'varchar', length: 255, nullable: true })
  query: string; // 搜索关键词

  @Column({ type: 'int', default: 10 })
  count: number; // 文章数量

  @Column({ type: 'varchar', length: 50, nullable: true })
  timeRange: string; // 时间范围

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipientEmail: string; // 收件人邮箱

  @CreateDateColumn({ type: 'timestamp' })
  createTime?: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedTime?: Date;
}
