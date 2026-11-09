import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  VersionColumn,
  type Relation,
} from 'typeorm';
import { DeveloperEntity } from './developer.entity.js';
import { SkillEntity } from './skill.entity.js';

@Entity('developerskillsmapper')
export class DeveloperSkillMapperEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'skillsmapperid' })
  skillsMapperId: string;

  @VersionColumn({ type: 'integer', default: 1 })
  version: number;

  @Column({ type: 'varchar', length: 20, name: 'createdby' })
  createdBy: string;

  @CreateDateColumn({
    type: 'timestamp without time zone',
    name: 'createddate',
    default: () => 'now()',
  })
  createdDate: Date;

  @Column({ type: 'varchar', length: 20, name: 'modifiedby' })
  modifiedBy: string;

  @UpdateDateColumn({
    type: 'timestamp without time zone',
    name: 'modifieddate',
    default: () => 'now()',
  })
  modifiedDate: Date;

  @Column({ type: 'bigint', name: 'skillid' })
  skillId: string;

  @Column({ type: 'bigint', name: 'developerid' })
  developerId: string;

  @ManyToOne(
    () => DeveloperEntity,
    (developer) => developer.developerSkillMappers,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'developerid' })
  developer: Relation<DeveloperEntity>;

  @ManyToOne(() => SkillEntity, (skill) => skill.developerSkillMappers, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'skillid' })
  skill: Relation<SkillEntity>;
}
