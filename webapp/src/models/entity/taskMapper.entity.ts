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
import { DeveloperEntity } from './developer.entity.js';

@Entity('tasksmapper')
export class TaskMapperEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'taskmapperid' })
  taskMapperId: string;

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

  @Column({ type: 'bigint', name: 'developerid' })
  developerId: string;

  @ManyToOne(() => TaskEntity, (task) => task.taskMappers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'taskid' })
  task: Relation<TaskEntity>;

  @ManyToOne(() => DeveloperEntity, (developer) => developer.taskMappers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'developerid' })
  developer: Relation<DeveloperEntity>;
}
