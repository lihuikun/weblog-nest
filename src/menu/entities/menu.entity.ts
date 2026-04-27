import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity()
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'int' })
  teamId: number;

  @Column({ type: 'varchar', length: 20 })
  title: string;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'boolean', default: false })
  shareToSquare: boolean;

  // 菜单广场菜单ID：新增/查看时会自动补记录
  @Index()
  @Column({ type: 'int', nullable: true })
  squareMenuId?: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  cover: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'tinyint' })
  recommendation: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  duration?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  difficulty?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createTime: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedTime: Date;
}
