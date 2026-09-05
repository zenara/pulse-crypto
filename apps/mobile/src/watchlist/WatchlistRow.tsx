import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TradingPair } from '@pulse-crypto/contracts';
import { selectMarket, useMarketStore } from '../state/market-store';
import { useFavoritesStore } from '../state/favorites-store';
import { changeTone, formatChangePercent, formatPrice } from './format-market';

interface WatchlistRowProps {
  symbol: TradingPair;
  displayName: string;
}

export const WatchlistRow = memo(function WatchlistRow({
  symbol,
  displayName,
}: WatchlistRowProps) {
  const market = useMarketStore(selectMarket(symbol));
  const favorite = useFavoritesStore((state) =>
    state.favorites.includes(symbol),
  );
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);

  const onToggle = useCallback(() => {
    void toggleFavorite(symbol);
  }, [symbol, toggleFavorite]);

  const tone = changeTone(market?.change24hPercent);

  return (
    <View style={styles.row} testID={`pair-${symbol}`}>
      <View style={styles.pair}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.symbol}>{symbol}</Text>
      </View>
      <View style={styles.quotes}>
        <Text testID={`pair-${symbol}-price`} style={styles.price}>
          {formatPrice(market?.lastPrice)}
        </Text>
        <Text
          testID={`pair-${symbol}-change`}
          style={[
            styles.change,
            tone === 'up' && styles.up,
            tone === 'down' && styles.down,
          ]}
        >
          {formatChangePercent(market?.change24hPercent)}
        </Text>
      </View>
      <Pressable
        testID={`pair-${symbol}-favorite`}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={
          favorite
            ? `Remove ${symbol} from favourites`
            : `Add ${symbol} to favourites`
        }
        hitSlop={8}
        style={styles.favorite}
      >
        <Text style={styles.star}>{favorite ? '★' : '☆'}</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  pair: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  symbol: {
    marginTop: 2,
    fontSize: 12,
    color: '#6b7280',
  },
  quotes: {
    alignItems: 'flex-end',
    minWidth: 96,
  },
  price: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    color: '#111827',
  },
  change: {
    marginTop: 2,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    color: '#6b7280',
  },
  up: {
    color: '#15803d',
  },
  down: {
    color: '#b91c1c',
  },
  favorite: {
    marginLeft: 12,
    width: 36,
    alignItems: 'center',
  },
  star: {
    fontSize: 22,
    color: '#d97706',
  },
});
