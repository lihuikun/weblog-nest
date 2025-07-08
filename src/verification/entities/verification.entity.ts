import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum VerificationType {
  EMAIL_REGISTRATION = 'email_registration',
  PASSWORD_RESET = 'password_reset',
}

@Entity()
export class Verification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 6 })
  code: string;

  @Column({ type: 'enum', enum: VerificationType })
  type: VerificationType;

  @Column({ type: 'boolean', default: false })
  used: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createTime: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  expireTime: Date;
} 