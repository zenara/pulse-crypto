import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { TradingPair } from '@pulse-crypto/contracts';
import { colors, mono } from '../theme';
import { selectMarket, useMarketStore } from '../state/market-store';
import { useFavoritesStore } from '../state/favorites-store';
import { useTickFlash } from '../ui/use-tick-flash';
import { changeTone, formatChangePercent, formatPrice } from './format-market';

interface WatchlistRowProps {
  symbol: TradingPair;
  displayName: string;
  onSelectPair: (pair: TradingPair) => void;
}

export const WatchlistRow = memo(function WatchlistRow({
  symbol,
  displayName,
  onSelectPair,
}: WatchlistRowProps) {
  const market = useMarketStore(selectMarket(symbol));
  const favorite = useFavoritesStore((state) =>
    state.favorites.includes(symbol),
  );
  const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
  const flash = useTickFlash(market?.lastPrice);

  const onOpen = useCallback(() => {
    onSelectPair(symbol);
  }, [onSelectPair, symbol]);

  const onToggle = useCallback(() => {
    void toggleFavorite(symbol);
  }, [symbol, toggleFavorite]);

  const tone = changeTone(market?.change24hPercent);

  return (
    <View
      style={[
        styles.row,
        flash === 'up' && styles.flashUp,
        flash === 'down' && styles.flashDown,
      ]}
      testID={`pair-${symbol}`}
    >
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
        <Text style={[styles.star, favorite && styles.starOn]}>
          {favorite ? '★' : '☆'}
        </Text>
      </Pressable>
      <Pressable
        testID={`pair-${symbol}-open`}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`View ${symbol} details`}
        style={styles.open}
      >
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
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    borderRadius: 8,
  },
  flashUp: {
    backgroundColor: colors.secondaryDim,
  },
  flashDown: {
    backgroundColor: colors.tertiaryDim,
  },
  open: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pair: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  symbol: {
    marginTop: 2,
    fontSize: 11,
    letterSpacing: 0.4,
    color: colors.muted,
    fontFamily: mono,
  },
  quotes: {
    alignItems: 'flex-end',
    minWidth: 96,
  },
  price: {
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    color: colors.text,
    fontFamily: mono,
  },
  change: {
    marginTop: 2,
    fontSize: 13,
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
  favorite: {
    marginRight: 8,
    width: 28,
    alignItems: 'center',
  },
  star: {
    fontSize: 20,
    color: colors.muted,
  },
  starOn: {
    color: colors.secondary,
  },
});
