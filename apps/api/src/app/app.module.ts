import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiExceptionFilter } from '../common/api-exception.filter';
import { BinanceFeedModule } from '../market/feed/binance-feed.module';
import { PairsApiModule } from '../market/api/pairs-api.module';

@Module({
  imports: [BinanceFeedModule, PairsApiModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
  ],
})
export class AppModule {}
