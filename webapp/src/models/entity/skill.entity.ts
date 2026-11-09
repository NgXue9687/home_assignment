import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  VersionColumn,
} from 'typeorm';
import { DeveloperSkillMapperEntity } from './developerSkillMapper.entity.js';
import { TaskSkillMapperEntity } from './taskSkillMapper.entity.js';

@Entity('skills')
export class SkillEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'skillid' })
  skillId: string;

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

  @Column({ type: 'varchar', length: 255, name: 'skillname' })
  skillName: string;

  @Column({ type: 'text', name: 'skilldescription' })
  skillDescription: string;

  @Column({ type: 'varchar', length: 1 })
  status: string;

  @OneToMany(() => DeveloperSkillMapperEntity, (devSkill) => devSkill.skill)
  developerSkillMappers: DeveloperSkillMapperEntity[];

  @OneToMany(() => TaskSkillMapperEntity, (taskSkill) => taskSkill.skill)
  taskSkillMappers: TaskSkillMapperEntity[];
}
