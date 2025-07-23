import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Interview } from '../../interview/entities/interview.entity';

@Entity()
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  interviewId: number;

  @Column()
  userId: number;

  @ManyToOne(() => Interview, (interview) => interview.likes)
  interview: Interview;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
