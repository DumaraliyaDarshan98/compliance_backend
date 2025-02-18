import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CONFIG } from './utils/keys/keys';
import mongoose from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

   mongoose
    .connect(CONFIG.databaseUrl)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch((err) => console.error('❌ MongoDB connection failed:', err));

  await app.listen(3000);
}
bootstrap();
