import React, { useMemo } from 'react';
import { StyleSheet, Text, View, type DimensionValue } from 'react-native';
import type { OrderBookLevel } from '@pulse-crypto/contracts';
import { colors, mono } from '../theme';
import { useTickFlash } from '../ui/use-tick-flash';
import { formatPrice, formatQuantity } from '../watchlist/format-market';

interface OrderBookProps {
  bids: readonly OrderBookLevel[];
  asks: readonly OrderBookLevel[];
}

export function OrderBook({ bids, asks }: OrderBookProps) {
  const maxQuantity = useMemo(() => {
    let max = 0;
    for (const level of bids) {
      max = Math.max(max, level.quantity);
    }
    for (const level of asks) {
      max = Math.max(max, level.quantity);
    }
    return max || 1;
  }, [bids, asks]);

  if (bids.length === 0 && asks.length === 0) {
    return (
      <Text testID="order-book-empty" style={styles.empty}>
        No order-book levels yet
      </Text>
    );
  }

  const rows = Math.max(bids.length, asks.length);

  return (
    <View testID="order-book">
      <View style={styles.header}>
        <Text style={[styles.headerCell, styles.bidHeader]}>Bids</Text>
        <Text style={[styles.headerCell, styles.askHeader]}>Asks</Text>
      </View>
      {Array.from({ length: rows }, (_, index) => {
        const bid = bids[index];
        const ask = asks[index];
        return (
          <View key={index} style={styles.level}>
            <BookSide
              side="bid"
              level={bid}
              maxQuantity={maxQuantity}
              priceTestID={`bid-${index}-price`}
              quantityTestID={`bid-${index}-quantity`}
            />
            <BookSide
              side="ask"
              level={ask}
              maxQuantity={maxQuantity}
              priceTestID={`ask-${index}-price`}
              quantityTestID={`ask-${index}-quantity`}
            />
          </View>
        );
      })}
    </View>
  );
}

function BookSide({
  side,
  level,
  maxQuantity,
  priceTestID,
  quantityTestID,
}: {
  side: 'bid' | 'ask';
  level: OrderBookLevel | undefined;
  maxQuantity: number;
  priceTestID: string;
  quantityTestID: string;
}) {
  const flash = useTickFlash(level?.quantity);
  const width: DimensionValue = level
    ? `${Math.max(8, (level.quantity / maxQuantity) * 100)}%`
    : 0;
  const isBid = side === 'bid';

  return (
    <View
      style={[
        styles.side,
        flash === 'up' && styles.flashUp,
        flash === 'down' && styles.flashDown,
      ]}
    >
      {level ? (
        <View
          style={[
            styles.depth,
            isBid ? styles.depthBid : styles.depthAsk,
            { width },
          ]}
        />
      ) : null}
      <Text
        testID={priceTestID}
        style={[styles.cell, isBid ? styles.bid : styles.ask]}
      >
        {level ? formatPrice(level.price) : '—'}
      </Text>
      <Text
        testID={quantityTestID}
        style={[styles.cell, styles.qty, isBid ? styles.bid : styles.ask]}
      >
        {level ? formatQuantity(level.quantity) : '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 14,
    color: colors.muted,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  headerCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  bidHeader: {
    color: colors.secondary,
  },
  askHeader: {
    color: colors.tertiary,
    textAlign: 'right',
  },
  level: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  flashUp: {
    backgroundColor: colors.secondaryDim,
  },
  flashDown: {
    backgroundColor: colors.tertiaryDim,
  },
  depth: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  depthBid: {
    left: 0,
    backgroundColor: colors.secondaryDim,
  },
  depthAsk: {
    right: 0,
    backgroundColor: colors.tertiaryDim,
  },
  cell: {
    flex: 1,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontFamily: mono,
    zIndex: 1,
  },
  qty: {
    textAlign: 'right',
  },
  bid: {
    color: colors.secondary,
  },
  ask: {
    color: colors.tertiary,
  },
});
