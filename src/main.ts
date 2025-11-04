import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Configure CORS for both development and production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  app.enableCors({
    origin: isDevelopment 
      ? [
          'http://localhost:3000', // Next.js default
          'http://localhost:3001', // Next.js alternate
        ]
      : [
          'https://fs-final-exam-frontend.vercel.app', // Production Vercel
          /^https:\/\/.*\.vercel\.app$/, // Any Vercel preview deployments
          /^https:\/\/fs-final-exam-frontend-.*\.vercel\.app$/, // Specific app previews
        ],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept',
      'Origin',
      'X-Requested-With',
      'Access-Control-Allow-Origin',
      'apollo-require-preflight'
    ],
    exposedHeaders: ['Content-Length'],
    optionsSuccessStatus: 204, // evita error 400 en preflight
    preflightContinue: false,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT ?? 3010;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on port ${port}`);
}
void bootstrap();
