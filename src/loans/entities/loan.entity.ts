
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Student } from '../../students/entities/student.entity';
import { Admin } from '../../admins/entities/admin.entity';
import { Copy } from '../../copies/entities/copy.entity';

export enum LoanStatus {
  ACTIVE = 'ACTIVE',
  RETURNED = 'RETURNED',
}

@Entity('loans')
export class Loan {
  @PrimaryGeneratedColumn()
  id: number;

  // Estudiante que recibe el préstamo.
  @Column()
  student_id: number;

  @ManyToOne(() => Student, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  // Ejemplar físico prestado.
  @Column()
  copy_id: number;

  @ManyToOne(() => Copy, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'copy_id' })
  copy: Copy;

  // Administrador que registra el préstamo.
  @Column()
  admin_id: number;

  @ManyToOne(() => Admin, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  // Fechas del préstamo.
  @Column({ type: 'date' })
  loan_date: string;

  @Column({ type: 'date' })
  due_date: string;

  // Fecha y hora en que se realizó la devolución.
  @Column({ type: 'datetime', nullable: true })
  returned_at: Date | null;

  // Observaciones específicas de la devolución.
  @Column({ type: 'text', nullable: true })
  return_notes: string | null;

  // Estado actual del préstamo.
  @Column({
    type: 'enum',
    enum: LoanStatus,
    default: LoanStatus.ACTIVE,
  })
  status: LoanStatus;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
