declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    MARKET_UPDATE_INTERVAL_MS?: string;
    ORDER_BOOK_DEPTH?: string;
    BINANCE_WS_BASE_URL?: string;
    BINANCE_FEED_ENABLED?: string;
  }
}
