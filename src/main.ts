import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: [
      'https://fs-final-exam-frontend.vercel.app', // frontend Vercel
      'http://localhost:3000',
    ],
    credentials: true,
  });
  app.useWebSocketAdapter(new IoAdapter(app));

  const port = process.env.PORT ?? 3010;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on port ${port}`);
}
void bootstrap();
