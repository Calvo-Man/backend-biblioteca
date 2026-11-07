import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import cookieParser from 'cookie-parser';

import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
  );

  const configService = app.get(ConfigService);

  // =====================================================
  // PREFIJO GLOBAL DE LA API
  // =====================================================

  app.setGlobalPrefix('api');

  // =====================================================
  // ARCHIVOS ESTÁTICOS
  // =====================================================

  // Permite visualizar las portadas almacenadas localmente.
  app.useStaticAssets(
    join(process.cwd(), 'uploads'),
    {
      prefix: '/uploads/',
    },
  );

  // =====================================================
  // MIDDLEWARE PARA LEER COOKIES
  // =====================================================

  app.use(cookieParser());

  // =====================================================
  // VALIDACIONES GLOBALES
  // =====================================================

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // =====================================================
  // CONFIGURACIÓN CORS
  // =====================================================

  app.enableCors({
    origin:
      configService.get<string>('FRONTEND_URL') ||
      'http://localhost:5173',

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
    ],

    credentials: true,
  });

  // =====================================================
  // INICIAR SERVIDOR
  // =====================================================

  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);

  console.log(
    `Servidor ejecutándose en http://localhost:${port}/api`,
  );
}

bootstrap();