
import 'dotenv/config';

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Admin } from '../admins/entities/admin.entity';
import { Student } from '../students/entities/student.entity';
import { Loan } from '../loans/entities/loan.entity';
import { Book } from '../books/entities/book.entity';
import { Copy } from '../copies/entities/copy.entity';
import { Category } from '../categories/entities/category.entity';

async function createAdmin() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,

    // Registrar las entidades relacionadas para que TypeORM
    // pueda construir correctamente todas sus relaciones.
    entities: [
      Admin,
      Student,
      Loan,
      Book,
      Copy,
      Category,
    ],

    synchronize: false,
  });

  try {
    await dataSource.initialize();

    const adminRepository = dataSource.getRepository(Admin);

    const username = process.env.INITIAL_ADMIN_USERNAME || 'admin';
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    const fullName = 'Administrador del sistema';

    if (!password || password.length < 8) {
      throw new Error(
        'INITIAL_ADMIN_PASSWORD debe tener al menos 8 caracteres.',
      );
    }

    const existingAdmin = await adminRepository.findOne({
      where: { username },
    });

    if (existingAdmin) {
      console.log(`El administrador "${username}" ya existe.`);
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = adminRepository.create({
      full_name: fullName,
      username,
      password: hashedPassword,
      is_active: true,
    });

    await adminRepository.save(admin);

    console.log('Administrador inicial creado correctamente.');
    console.log(`Usuario: ${username}`);
  } catch (error) {
    console.error('Error creando administrador:', error);
    process.exitCode = 1;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

createAdmin();
