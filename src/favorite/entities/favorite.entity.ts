import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Interview } from '../../interview/entities/interview.entity';
import { User } from '../../user/entities/user.entity';

@Entity()
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  interviewId: number;

  @Column()
  userId: number;

  @ManyToOne(() => Interview, (interview) => interview.favorites)
  interview: Interview;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
