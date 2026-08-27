import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Serve uploaded files (logos)
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  const prisma = app.get(PrismaService);
  await prisma.onModuleInit();

  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);
  console.log(`Gym API running on http://localhost:${port}/api`);
}
bootstrap();
