import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Book } from '../../books/entities/book.entity';
import { Loan } from '../../loans/entities/loan.entity';

export enum CopyStatus {
  AVAILABLE = 'AVAILABLE',
  LOANED = 'LOANED',
  DAMAGED = 'DAMAGED',
  LOST = 'LOST',
  IN_REPAIR = 'IN_REPAIR',
}

export enum CopyCondition {
  NEW = 'NEW',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
}

@Entity('copies')
export class Copy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  copy_code: string;

  @Column({
    type: 'enum',
    enum: CopyStatus,
    default: CopyStatus.AVAILABLE,
  })
  status: CopyStatus;

  @Column({
    type: 'enum',
    enum: CopyCondition,
    default: CopyCondition.GOOD,
  })
  condition: CopyCondition;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column()
  book_id: number;

  @ManyToOne(() => Book, (book) => book.copies, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Loan, (loan) => loan.copy)
  loans: Loan[];
}
