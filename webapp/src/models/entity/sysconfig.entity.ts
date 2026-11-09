import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

@Entity('sysconfig')
export class SysConfigEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'sysconfigid' })
  sysConfigId: string;

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

  @Column({ type: 'varchar', length: 255, name: 'sysconfigname' })
  sysConfigName: string;

  @Column({ type: 'varchar', length: 255, name: 'sysconfigvalue' })
  sysConfigValue: string;
}
