import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Article } from '../../article/entities/article.entity';

@Entity()
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Article, (article) => article.likes)
  article: Article;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
