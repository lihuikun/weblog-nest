import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Article } from '../../article/entities/article.entity';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  articleId: number;

  @Column()
  userId: number;

  @ManyToOne(() => Article, (article) => article.likes)
  article: Article;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
