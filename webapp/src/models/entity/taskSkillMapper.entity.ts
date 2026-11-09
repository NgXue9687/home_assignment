import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  type Relation,
  VersionColumn,
} from 'typeorm';
import { TaskEntity } from './task.entity.js';
import { SkillEntity } from './skill.entity.js';

@Entity('taskskillsmapper')
export class TaskSkillMapperEntity {
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

  @Column({ type: 'bigint', name: 'taskid' })
  taskId: string;

  @Column({ type: 'bigint', name: 'skillid' })
  skillId: string;

  @ManyToOne(() => TaskEntity, (task) => task.taskSkillMappers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskid' })
  task: Relation<TaskEntity>;

  @ManyToOne(() => SkillEntity, (skill) => skill.taskSkillMappers)
  @JoinColumn({ name: 'skillid' })
  skill: Relation<SkillEntity>;
}
