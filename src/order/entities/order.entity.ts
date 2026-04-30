import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum OrderStatus {
  MAKING = 'MAKING',
  COMPLETED = 'COMPLETED',
}

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40 })
  orderNo: string;

  @Index()
  @Column({ type: 'int' })
  teamId: number;

  @Index()
  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 20, default: OrderStatus.MAKING })
  status: OrderStatus;

  @CreateDateColumn({ type: 'timestamp' })
  createTime: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedTime: Date;
}
