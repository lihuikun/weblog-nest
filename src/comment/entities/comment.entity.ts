import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';
import { Article } from '../../article/entities/article.entity';
import { User } from 'src/user/entities/user.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  content: string;

  @ManyToOne(() => Article, (article) => article.comments)
  article: Article;

  @ManyToOne(() => Comment, { nullable: true }) // 父评论
  parentComment: Comment;

  @OneToMany(() => Comment, (comment) => comment.parentComment) // 子评论
  replies: Comment[];
  // 新增字段：加载顶级评论
  @OneToMany(() => Comment, (comment) => comment.article)
  topLevelComments: Relation<Comment[]>;

  @ManyToOne(() => User, (user) => user.id)
  user: User; // 关联用户实体

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
