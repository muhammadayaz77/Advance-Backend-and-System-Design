import dns from 'node:dns';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

// Prefer IPv4 when resolving hostnames (prevents EHOSTUNREACH on IPv6-only paths,
// e.g. Gmail SMTP on networks that don't route IPv6)
dns.setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Security headers
  app.use(helmet());

  // Cookie parser — required for the httpOnly refresh token
  app.use(cookieParser());

  // Increase body size limit to handle video uploads up to 100 MB
  // (default Express limit is 100 kb; Multer's memoryStorage handles the actual buffer)
  app.useBodyParser('json', { limit: '105mb' });
  app.useBodyParser('urlencoded', { limit: '105mb', extended: true });

  // CORS — only allow requests from the configured frontend origin
  app.enableCors({
    origin: config.getOrThrow<string>('CLIENT_URL'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Versioned API prefix
  app.setGlobalPrefix('api/v1');

  app.enableShutdownHooks();

  const port = config.get<number>('PORT') ?? 3001;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}/api/v1`);
}
void bootstrap();
