import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Loan } from '../../loans/entities/loan.entity';

@Entity('students')
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 120 })
  full_name: string;

  @Column({ unique: true, length: 20 })
  document_number: string;

  @Column({ length: 20 })
  student_code: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ select: false })
  password: string;

  @Column({ length: 50 })
  grade: string;

  @Column({ length: 20 })
  group_name: string;

  @Column({ length: 120 })
  email: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Loan, (loan) => loan.student)
  loans: Loan[];
}
