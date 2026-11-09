import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  VersionColumn,
  DeleteDateColumn,
  type Relation,
} from 'typeorm';
import { TaskMapperEntity } from './taskMapper.entity.js';
import { TaskSkillMapperEntity } from './taskSkillMapper.entity.js';

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'taskid' })
  taskId: string;

  @Column({ type: 'varchar', length: 36, unique: true })
  uuid: string;

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

  @Column({ type: 'varchar', length: 255, name: 'tasktitle' })
  taskTitle: string;

  @Column({ type: 'text', nullable: true, name: 'taskdescription' })
  taskDescription: string | null;

  @Column({ type: 'varchar', length: 1, default: 'T' })
  status: string;

  @Column({ type: 'bigint', name: 'parenttaskid', nullable: true })
  parentTaskId: string | null;

  @ManyToOne(() => TaskEntity, (task) => task.subtasks, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parenttaskid' })
  parentTask: Relation<TaskEntity> | null;

  @OneToMany(() => TaskEntity, (task) => task.parentTask)
  subtasks: TaskEntity[];

  @OneToMany(() => TaskMapperEntity, (taskMapper) => taskMapper.task)
  taskMappers: TaskMapperEntity[];

  @OneToMany(() => TaskSkillMapperEntity, (taskSkill) => taskSkill.task)
  taskSkillMappers: TaskSkillMapperEntity[];

  @DeleteDateColumn({
    type: 'timestamp without time zone',
    name: 'deleteddate',
    nullable: true,
  })
  deletedDate: Date | null;
}
