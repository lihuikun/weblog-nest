import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: string;

  @Column()
  article_status: number;

  @CreateDateColumn()
  publish_date: number;

  @UpdateDateColumn()
  last_modify_date: number;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column('text')
  content: string;

  @Column()
  category_id: string;

  @Column()
  publish_ip: string;

  @Column()
  last_modify_ip: string;

  @Column()
  category_name: string;

  @Column()
  like_count: number;

  @Column()
  view_count: number;
}
