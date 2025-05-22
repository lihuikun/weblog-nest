import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum LoginType {
  EMAIL = 'email',
  WECHAT_MINI = 'wechat_mini',
  WECHAT_OFFICIAL = 'wechat_official',
  GITHUB = 'github'
}

export enum Role {
  ADMIN = 'admin',
  SUBADMIN = 'subAdmin',
  USER = 'user'
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: true })
  nickname?: string;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  openId?: string; // 微信用户的唯一标识

  @Column({ type: 'varchar', unique: true, nullable: true })
  email?: string; // 邮箱登录用户的唯一标识

  @Column({ type: 'varchar', nullable: true })
  password?: string; // 邮箱登录用户的密码

  @Column({ type: 'enum', enum: LoginType, nullable: false })
  loginType: LoginType; // 用户登录类型

  // token
  @Column({ type: 'varchar', nullable: true })
  token?: string;

  // 角色,默认用户
  @Column({ type: 'enum', enum: Role, default: Role.USER, nullable: false })
  role: Role;

  @CreateDateColumn({ type: 'timestamp' })
  createTime?: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedTime?: Date;
}
