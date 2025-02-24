import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  nickname?: string;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'varchar', unique: true, nullable: false })
  openId: string; // 微信用户的唯一标识

  // token
  @Column({ type: 'varchar', nullable: true })
  token?: string;
}
