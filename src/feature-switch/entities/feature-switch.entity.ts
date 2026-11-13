import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/** 全局仅一条：总开关 + 可扩展 JSON（key 由业务自定，如小程序侧约定） */
@Entity('app_feature_config')
export class AppFeatureConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'boolean', default: false })
  enabled: boolean;

  @Column({ type: 'json', nullable: true })
  config?: Record<string, unknown> | null;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedTime?: Date;
}
