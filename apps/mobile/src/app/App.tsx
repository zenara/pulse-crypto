import React, { useEffect, useMemo } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { MarketState, PairMetadata } from '@pulse-crypto/contracts';
import { readMobileEnv } from '../config/env';
import { MarketSession } from '../session/market-session';
import { useMarketStore, type MarketsByPair } from '../state/market-store';

export const App = () => {
  const env = useMemo(() => readMobileEnv(), []);
  const status = useMarketStore((state) => state.connectionStatus);
  const pairs = useMarketStore((state) => state.pairs);
  const markets = useMarketStore((state) => state.markets);
  const metaError = useMarketStore((state) => state.metaError);

  useEffect(() => {
    const session = new MarketSession({
      apiUrl: env.apiUrl,
      wsUrl: env.wsUrl,
    });
    session.start();
    return () => {
      session.stop();
    };
  }, [env.apiUrl, env.wsUrl]);

  const rows = rowsForDisplay(pairs, markets);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} testID="heading" role="heading">
          PulseCrypto
        </Text>
        <Text testID="connection-status" style={styles.status}>
          {status}
        </Text>
        {!env.wsUrl ? (
          <Text style={styles.hint}>Set EXPO_PUBLIC_WS_URL to receive live prices.</Text>
        ) : null}
        {metaError ? <Text style={styles.error}>{metaError}</Text> : null}
        {rows.map((row) => (
          <Text key={row.symbol} testID={`pair-${row.symbol}`} style={styles.row}>
            {row.label}
            {row.price === undefined ? '' : `  ${row.price}`}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

function rowsForDisplay(
  pairs: readonly PairMetadata[],
  markets: MarketsByPair,
): Array<{ symbol: string; label: string; price: number | undefined }> {
  if (pairs.length > 0) {
    return pairs.map((pair) => ({
      symbol: pair.symbol,
      label: pair.displayName,
      price: markets[pair.symbol]?.lastPrice,
    }));
  }

  return Object.values(markets)
    .filter((market): market is MarketState => market !== undefined)
    .map((market) => ({
    symbol: market.pair,
    label: market.pair,
    price: market.lastPrice,
  }));
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
  },
  status: {
    marginTop: 8,
    fontSize: 16,
    color: '#4b5563',
    textTransform: 'capitalize',
  },
  hint: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  error: {
    marginTop: 12,
    fontSize: 14,
    color: '#b91c1c',
  },
  row: {
    marginTop: 10,
    fontSize: 16,
  },
});

export default App;
