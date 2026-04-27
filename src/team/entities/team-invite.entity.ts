import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TeamInviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

@Entity()
export class TeamInvite {
  @PrimaryGeneratedColumn()
  id: number;

  // 被邀请加入的目标团队ID
  @Column({ type: 'int' })
  targetTeamId: number;

  @Column({ type: 'int' })
  inviterUserId: number;

  // 邀请短链唯一标识
  @Column({ type: 'varchar', length: 16, unique: true })
  code: string;

  @Column({ type: 'enum', enum: TeamInviteStatus, default: TeamInviteStatus.PENDING })
  status: TeamInviteStatus;

  @Column({ type: 'timestamp' })
  expireAt: Date;

  @CreateDateColumn({ type: 'timestamp' })
  createTime: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedTime: Date;
}
