import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { OrderBookLevel } from '@pulse-crypto/contracts';
import { formatPrice, formatQuantity } from '../watchlist/format-market';

interface OrderBookProps {
  bids: readonly OrderBookLevel[];
  asks: readonly OrderBookLevel[];
}

export function OrderBook({ bids, asks }: OrderBookProps) {
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
            <Text testID={`bid-${index}-price`} style={[styles.cell, styles.bid]}>
              {bid ? formatPrice(bid.price) : '—'}
            </Text>
            <Text
              testID={`bid-${index}-quantity`}
              style={[styles.cell, styles.bid, styles.qty]}
            >
              {bid ? formatQuantity(bid.quantity) : '—'}
            </Text>
            <Text testID={`ask-${index}-price`} style={[styles.cell, styles.ask]}>
              {ask ? formatPrice(ask.price) : '—'}
            </Text>
            <Text
              testID={`ask-${index}-quantity`}
              style={[styles.cell, styles.ask, styles.qty]}
            >
              {ask ? formatQuantity(ask.quantity) : '—'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontSize: 14,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  headerCell: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  bidHeader: {
    color: '#15803d',
  },
  askHeader: {
    color: '#b91c1c',
    textAlign: 'right',
  },
  level: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  cell: {
    flex: 1,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  qty: {
    textAlign: 'right',
  },
  bid: {
    color: '#15803d',
  },
  ask: {
    color: '#b91c1c',
  },
});
