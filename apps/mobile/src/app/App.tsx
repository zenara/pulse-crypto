import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type {
  ConnectionStatus,
  MarketState,
  PairMetadata,
} from '@pulse-crypto/contracts';
import { readMobileEnv } from '../config/env';
import { apiErrorMessage } from '../networking/api-error';
import { MarketWebSocketService } from '../networking/market-websocket.service';
import { fetchPairsMeta } from '../networking/pairs-meta-api';

export const App = () => {
  const env = useMemo(() => readMobileEnv(), []);
  const [status, setStatus] = useState<ConnectionStatus>(
    env.wsUrl ? 'disconnected' : 'error',
  );
  const [pairs, setPairs] = useState<readonly PairMetadata[]>([]);
  const [markets, setMarkets] = useState<readonly MarketState[]>([]);
  const [metaError, setMetaError] = useState<string | undefined>();

  useEffect(() => {
    if (!env.apiUrl) {
      return;
    }

    let cancelled = false;
    fetchPairsMeta(env.apiUrl)
      .then((result) => {
        if (!cancelled) {
          setPairs(result);
          setMetaError(undefined);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMetaError(apiErrorMessage(error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [env.apiUrl]);

  useEffect(() => {
    if (!env.wsUrl) {
      return;
    }

    const service = new MarketWebSocketService({
      url: env.wsUrl,
      listener: {
        onStatus: setStatus,
        onSnapshot: setMarkets,
        onProtocolError: () => undefined,
      },
    });
    service.start();
    return () => {
      service.stop();
    };
  }, [env.wsUrl]);

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
  markets: readonly MarketState[],
): Array<{ symbol: string; label: string; price: number | undefined }> {
  if (pairs.length > 0) {
    return pairs.map((pair) => ({
      symbol: pair.symbol,
      label: pair.displayName,
      price: markets.find((market) => market.pair === pair.symbol)?.lastPrice,
    }));
  }

  return markets.map((market) => ({
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
