import React, { useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TradingPair } from '@pulse-crypto/contracts';
import { colors } from '../theme';
import { ErrorBanner } from '../ui/ErrorBanner';
import { StaleDataHint } from '../ui/StaleDataHint';
import { useFavoritesStore } from '../state/favorites-store';
import { useMarketStore } from '../state/market-store';
import { ConnectionBanner } from './ConnectionBanner';
import { filterWatchlistPairs, resolveWatchlistPairs } from './filter-watchlist';
import { WatchlistRow } from './WatchlistRow';

interface WatchlistScreenProps {
  wsConfigured: boolean;
  onSelectPair: (pair: TradingPair) => void;
  onRefreshMeta?: () => Promise<void>;
}

export function WatchlistScreen({
  wsConfigured,
  onSelectPair,
  onRefreshMeta,
}: WatchlistScreenProps) {
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const pairs = useMarketStore((state) => state.pairs);
  const metaLoading = useMarketStore((state) => state.metaLoading);
  const metaError = useMarketStore((state) => state.metaError);
  const protocolError = useMarketStore((state) => state.protocolError);
  const persistError = useFavoritesStore((state) => state.persistError);

  const visible = useMemo(
    () => filterWatchlistPairs(resolveWatchlistPairs(pairs), query),
    [pairs, query],
  );

  const onRefresh = async () => {
    if (!onRefreshMeta) {
      return;
    }
    setRefreshing(true);
    try {
      await onRefreshMeta();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      testID="watchlist"
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            void onRefresh();
          }}
          tintColor={colors.secondary}
          colors={[colors.secondary]}
        />
      }
    >
      <View style={styles.top}>
        <View>
          <Text style={styles.kicker}>PulseCrypto</Text>
          <Text style={styles.title} testID="heading" role="heading">
            Markets
          </Text>
        </View>
        <ConnectionBanner />
      </View>
      <StaleDataHint />
      {metaLoading ? (
        <Text testID="watchlist-loading" style={styles.hint}>
          Loading markets…
        </Text>
      ) : null}
      {!wsConfigured ? (
        <Text style={styles.hint}>Set EXPO_PUBLIC_WS_URL to receive live prices.</Text>
      ) : null}
      {metaError ? (
        <ErrorBanner
          testID="meta-error"
          message={metaError}
          onRetry={
            onRefreshMeta
              ? () => {
                  void onRefresh();
                }
              : undefined
          }
        />
      ) : null}
      {protocolError ? <ErrorBanner message={protocolError} /> : null}
      {persistError ? <ErrorBanner message={persistError} /> : null}
      <TextInput
        testID="search-input"
        value={query}
        onChangeText={setQuery}
        placeholder="Search"
        placeholderTextColor={colors.muted}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.search}
      />
      {visible.length === 0 ? (
        <Text testID="watchlist-empty" style={styles.hint}>
          No matching pairs
        </Text>
      ) : (
        visible.map((pair) => (
          <WatchlistRow
            key={pair.symbol}
            symbol={pair.symbol}
            displayName={pair.displayName}
            onSelectPair={onSelectPair}
          />
        ))
      )}
    </ScrollView>
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  kicker: {
    fontSize: 12,
    letterSpacing: 1,
    color: colors.muted,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  hint: {
    marginTop: 12,
    fontSize: 14,
    color: colors.muted,
  },
  search: {
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
});
