import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BinanceFeedModule } from '../market/feed/binance-feed.module';

@Module({
  imports: [BinanceFeedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
