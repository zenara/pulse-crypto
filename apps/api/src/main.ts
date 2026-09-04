/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { applyNativeWsAdapter } from './market/gateway/apply-native-ws-adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  applyNativeWsAdapter(app);
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  Logger.log(`API listening on port ${port}`);
}

bootstrap();
