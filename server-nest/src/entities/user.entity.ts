import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './organization.entity';

export enum UserRole {
  CEO = 'ceo',
  CTO = 'cto',
  CISO = 'ciso',
  FINANCE = 'finance',
  SOFTWARE_ENGINEER = 'software_engineer',
  UI_UX_DESIGNER = 'ui_ux_designer',
  CUSTOMER_SUPPORT = 'customer_support',
}

@Entity('users')
export class User {
  @PrimaryColumn('uuid')
  id: string;

  @Column()
  org_id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'varchar', default: UserRole.SOFTWARE_ENGINEER })
  role: UserRole;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ default: false })
  two_factor_enabled: boolean;

  @Column({ nullable: true })
  two_factor_secret: string;

  @Column({ type: 'json', nullable: true })
  preferences: any;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Organization, (org) => org.users)
  @JoinColumn({ name: 'org_id' })
  organization: Organization;
}
