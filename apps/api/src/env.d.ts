declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    MARKET_UPDATE_INTERVAL_MS?: string;
    ORDER_BOOK_DEPTH?: string;
  }
}
