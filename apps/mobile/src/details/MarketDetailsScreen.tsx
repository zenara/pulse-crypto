import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TradingPair } from '@pulse-crypto/contracts';
import { selectMarket, useMarketStore } from '../state/market-store';
import { ConnectionBanner } from '../watchlist/ConnectionBanner';
import {
  changeTone,
  formatChangePercent,
  formatPressure,
  formatPrice,
  formatUpdatedAt,
} from '../watchlist/format-market';
import { OrderBook } from './OrderBook';

interface MarketDetailsScreenProps {
  pair: TradingPair;
  onBack: () => void;
}

export function MarketDetailsScreen({ pair, onBack }: MarketDetailsScreenProps) {
  const market = useMarketStore(selectMarket(pair));
  const displayName = useMarketStore(
    (state) =>
      state.pairs.find((item) => item.symbol === pair)?.displayName ?? pair,
  );
  const tone = changeTone(market?.change24hPercent);

  return (
    <ScrollView testID="market-details" contentContainerStyle={styles.content}>
      <Pressable
        testID="details-back"
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Back to watchlist"
        hitSlop={8}
      >
        <Text style={styles.back}>← Watchlist</Text>
      </Pressable>
      <Text style={styles.title} testID="details-title" role="heading">
        {displayName}
      </Text>
      <Text style={styles.symbol}>{pair}</Text>
      <ConnectionBanner />
      {market === undefined ? (
        <Text testID="details-empty" style={styles.hint}>
          Waiting for market data
        </Text>
      ) : (
        <>
          <Text testID="details-price" style={styles.price}>
            {formatPrice(market.lastPrice)}
          </Text>
          <Text
            testID="details-change"
            style={[
              styles.change,
              tone === 'up' && styles.up,
              tone === 'down' && styles.down,
            ]}
          >
            {formatChangePercent(market.change24hPercent)}
          </Text>
          <View style={styles.metrics}>
            <Metric label="Spread" testID="details-spread" value={formatPrice(market.spread)} />
            <Metric
              label="Buy pressure"
              testID="details-buy-pressure"
              value={formatPressure(market.buyPressure)}
            />
            <Metric
              label="Sell pressure"
              testID="details-sell-pressure"
              value={formatPressure(market.sellPressure)}
            />
          </View>
          <Text style={styles.section}>Order book</Text>
          <OrderBook bids={market.bids} asks={market.asks} />
          <Text testID="details-updated-at" style={styles.updated}>
            Last updated {formatUpdatedAt(market.updatedAt)}
          </Text>
        </>
      )}
    </ScrollView>
  );
}

function Metric({
  label,
  value,
  testID,
}: {
  label: string;
  value: string;
  testID: string;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text testID={testID} style={styles.metricValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 32,
  },
  back: {
    fontSize: 16,
    color: '#2563eb',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
  },
  symbol: {
    marginTop: 4,
    fontSize: 14,
    color: '#6b7280',
  },
  hint: {
    marginTop: 24,
    fontSize: 14,
    color: '#6b7280',
  },
  price: {
    marginTop: 20,
    fontSize: 32,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
    color: '#111827',
  },
  change: {
    marginTop: 4,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    color: '#6b7280',
  },
  up: {
    color: '#15803d',
  },
  down: {
    color: '#b91c1c',
  },
  metrics: {
    marginTop: 24,
    gap: 12,
  },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 15,
    color: '#6b7280',
  },
  metricValue: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    color: '#111827',
  },
  section: {
    marginTop: 28,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  updated: {
    marginTop: 20,
    fontSize: 13,
    color: '#6b7280',
  },
});
