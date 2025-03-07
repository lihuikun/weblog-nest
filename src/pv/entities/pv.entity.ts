import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Pv {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  path: string;

  @Column()
  ipAddress: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ nullable: true }) // 设备类型
  deviceType: string;

  @Column({ nullable: true }) // 浏览器名称
  browserName: string;

  @Column({ nullable: true }) // 浏览器版本
  browserVersion: string;
}
