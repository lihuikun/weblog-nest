import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Article } from '../../article/entities/article.entity';

@Entity()
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Article, (article) => article.favorites)
  article: Article;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
