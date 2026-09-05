import React from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { ConnectionStatus, MarketState, TradingPair } from '@pulse-crypto/contracts';
import { colors, mono } from '../theme';
import { selectMarket, useMarketStore } from '../state/market-store';
import { StaleDataHint } from '../ui/StaleDataHint';
import { useTickFlash } from '../ui/use-tick-flash';
import { ConnectionBanner } from '../watchlist/ConnectionBanner';
import {
  changeTone,
  formatChangePercent,
  formatPressure,
  formatPrice,
  formatQuantity,
  formatUpdatedAt,
} from '../watchlist/format-market';
import { OrderBook } from './OrderBook';

const depthShader = require('../../assets/images/depth-shader.png') as number;

interface MarketDetailsScreenProps {
  pair: TradingPair;
  onBack: () => void;
}

export function MarketDetailsScreen({ pair, onBack }: MarketDetailsScreenProps) {
  const market = useMarketStore(selectMarket(pair));
  const connectionStatus = useMarketStore((state) => state.connectionStatus);
  const displayName = useMarketStore(
    (state) =>
      state.pairs.find((item) => item.symbol === pair)?.displayName ?? pair,
  );
  const tone = changeTone(market?.change24hPercent);
  const flash = useTickFlash(market?.lastPrice);

  return (
    <ScrollView testID="market-details" contentContainerStyle={styles.content}>
      <View style={styles.top}>
        <Pressable
          testID="details-back"
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Back to watchlist"
          hitSlop={8}
        >
          <Text style={styles.back}>← Markets</Text>
        </Pressable>
        <ConnectionBanner />
      </View>
      <StaleDataHint />
      <Text style={styles.title} testID="details-title" role="heading">
        {displayName}
      </Text>
      <Text style={styles.symbol}>{pair}</Text>
      {market === undefined ? (
        <Text testID="details-empty" style={styles.hint}>
          {emptyMarketMessage(connectionStatus)}
        </Text>
      ) : (
        <>
          <View
            style={[
              styles.priceBlock,
              flash === 'up' && styles.flashUp,
              flash === 'down' && styles.flashDown,
            ]}
          >
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
          </View>
          <View style={styles.stats}>
            <Stat label="24H HIGH" value={formatPrice(market.high24h)} />
            <Stat label="24H LOW" value={formatPrice(market.low24h)} />
            <Stat label="VOLUME" value={formatQuantity(market.volume24h)} />
          </View>
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
          <MarketDepth market={market} />
          <Text testID="details-updated-at" style={styles.updated}>
            Last updated {formatUpdatedAt(market.updatedAt)}
          </Text>
        </>
      )}
    </ScrollView>
  );
}

function emptyMarketMessage(status: ConnectionStatus): string {
  if (status === 'connecting' || status === 'reconnecting') {
    return 'Connecting to live market data';
  }
  if (status === 'disconnected' || status === 'error') {
    return 'No market data received yet';
  }
  return 'Waiting for market data';
}

function MarketDepth({ market }: { market: MarketState }) {
  const bidQty = market.bids.reduce((sum, level) => sum + level.quantity, 0);
  const askQty = market.asks.reduce((sum, level) => sum + level.quantity, 0);
  const pressure =
    market.buyPressure !== null &&
    market.sellPressure !== null &&
    market.buyPressure > market.sellPressure
      ? 'Buy heavy'
      : market.sellPressure !== null &&
          market.buyPressure !== null &&
          market.sellPressure > market.buyPressure
        ? 'Sell heavy'
        : 'Balanced';

  return (
    <View style={styles.depthCard}>
      <Text style={styles.section}>Market depth</Text>
      <ImageBackground
        source={depthShader}
        style={styles.depthArt}
        imageStyle={styles.depthImage}
        resizeMode="cover"
      >
        <View style={styles.depthLegend}>
          <Text style={styles.depthBid}>Bids {formatQuantity(bidQty)}</Text>
          <Text style={styles.depthAsk}>Asks {formatQuantity(askQty)}</Text>
        </View>
      </ImageBackground>
      <Text testID="details-pressure-bias" style={styles.pressureBias}>
        Pressure {pressure}
      </Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  back: {
    fontSize: 15,
    color: colors.secondary,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  symbol: {
    marginTop: 4,
    fontSize: 13,
    letterSpacing: 0.6,
    color: colors.muted,
    fontFamily: mono,
  },
  hint: {
    marginTop: 24,
    fontSize: 14,
    color: colors.muted,
  },
  priceBlock: {
    marginTop: 20,
    borderRadius: 8,
    paddingVertical: 8,
  },
  flashUp: {
    backgroundColor: colors.secondaryDim,
  },
  flashDown: {
    backgroundColor: colors.tertiaryDim,
  },
  price: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    color: colors.secondary,
    fontFamily: mono,
  },
  change: {
    marginTop: 4,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    color: colors.muted,
    fontFamily: mono,
  },
  up: {
    color: colors.secondary,
  },
  down: {
    color: colors.tertiary,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.muted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 13,
    color: colors.text,
    fontFamily: mono,
  },
  metrics: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  metricValue: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    color: colors.text,
    fontFamily: mono,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.text,
  },
  depthCard: {
    marginTop: 8,
  },
  depthArt: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 12,
    backgroundColor: colors.surfaceAlt,
  },
  depthImage: {
    opacity: 0.85,
  },
  depthLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  depthBid: {
    color: colors.secondary,
    fontSize: 12,
    fontFamily: mono,
  },
  depthAsk: {
    color: colors.tertiary,
    fontSize: 12,
    fontFamily: mono,
  },
  pressureBias: {
    marginTop: 8,
    fontSize: 13,
    color: colors.muted,
  },
  updated: {
    marginTop: 20,
    fontSize: 12,
    color: colors.muted,
  },
});
