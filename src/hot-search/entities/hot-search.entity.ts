import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
@Entity('hot_search')
export class HotSearch {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  source: string; // 数据来源 (douyin, juejin, baidu)

  @Column({ type: 'longtext' })
  data: string; // 热搜词的list

  @Column({ nullable: true })
  url: string; // 详情链接

  @CreateDateColumn()
  created_at: Date; // 记录爬取时间
}
