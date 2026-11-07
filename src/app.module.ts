import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AdminsModule } from './admins/admins.module';
import { StudentsModule } from './students/students.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { BooksModule } from './books/books.module';
import { CopiesModule } from './copies/copies.module';
import { LoansModule } from './loans/loans.module';
import { ReturnsModule } from './returns/returns.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // Variables de entorno
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Conexión a MySQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        type: 'mysql',

        host: configService.get<string>('DB_HOST'),
        port: Number(configService.get<string>('DB_PORT', '3306')),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        timezone: '-05:00',
        autoLoadEntities: true,

        // Las tablas se crearán mediante migraciones
        synchronize: true, // Cambiar a false en producción
      }),
    }),

    // Módulos de la aplicación
    AdminsModule,
    StudentsModule,
    AuthModule,
    CategoriesModule,
    BooksModule,
    CopiesModule,
    LoansModule,
    ReturnsModule,
    ReportsModule,
    DashboardModule,
  ],
})
export class AppModule {}