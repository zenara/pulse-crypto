import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiExceptionFilter } from '../common/api-exception.filter';
import { MarketModule } from '../market/market.module';
import { PairsApiModule } from '../market/api/pairs-api.module';

@Module({
  imports: [MarketModule, PairsApiModule],
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
