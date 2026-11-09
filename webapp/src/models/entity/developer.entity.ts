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
import { TaskMapperEntity } from './taskMapper.entity.js';

@Entity('developers')
export class DeveloperEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'developerid' })
  developerId: string;

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

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 320, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  division: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  designation: string;

  @Column({ type: 'varchar', length: 1 })
  status: string;

  @OneToMany(() => TaskMapperEntity, (taskMapper) => taskMapper.developer)
  taskMappers: TaskMapperEntity[];

  @OneToMany(() => DeveloperSkillMapperEntity, (devSkill) => devSkill.developer)
  developerSkillMappers: DeveloperSkillMapperEntity[];
}
