import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Comment } from '../../comment/entities/comment.entity';
import { Like } from '../../like/entities/like.entity';
import { Favorite } from '../../favorite/entities/favorite.entity';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title?: string;

  @Column({ type: 'text' })
  content?: string;

  @Column({ type: 'int', default: 0 })
  viewCount?: number;

  @Column({ type: 'int', default: 0 })
  likeCount?: number;

  @Column({ type: 'int', default: 0 })
  categoryId?: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  coverImage?: string;

  @OneToMany(() => Comment, (comment) => comment.article, { cascade: true })
  comments?: Comment[];

  @OneToMany(() => Like, (like) => like.article, { cascade: true })
  likes?: Like[];

  @OneToMany(() => Favorite, (favorite) => favorite.article, { cascade: true })
  favorites: Favorite[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt?: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt?: Date;
}
