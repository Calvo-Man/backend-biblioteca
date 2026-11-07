import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Category } from '../../categories/entities/category.entity';
import { Copy } from '../../copies/entities/copy.entity';

@Entity('books')
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ length: 150 })
  author: string;

  @Column({ length: 150, nullable: true })
  publisher: string;

  @Column({ length: 20, nullable: true, unique: true })
  isbn: string;

  @Column({ type: 'year', nullable: true })
  publication_year: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cover_image: string | null;

  @Column({ default: true })
  is_active: boolean;

  @ManyToOne(() => Category, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column()
  category_id: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => Copy, (copy) => copy.book)
  copies: Copy[];
}
