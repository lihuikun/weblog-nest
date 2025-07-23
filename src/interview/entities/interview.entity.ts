import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Like } from '../../like/entities/like.entity';
import { Favorite } from '../../favorite/entities/favorite.entity';

@Entity()
export class Interview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'text' })
  answer: string;

  @Column({ type: 'int', default: 0 })
  categoryId: number;

  @Column({ type: 'int', default: 0 })
  difficulty: number; // 难度等级，1-5

  @Column({ type: 'boolean', default: false })
  requirePremium: boolean; // 是否需要会员权限

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  likeCount: number;

  @Column({ type: 'int', default: 0 })
  favoriteCount: number;

  @CreateDateColumn({ type: 'timestamp' })
  createTime: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedTime: Date;
  
  @OneToMany(() => Like, like => like.interview)
  likes: Like[];
  
  @OneToMany(() => Favorite, favorite => favorite.interview)
  favorites: Favorite[];
} 