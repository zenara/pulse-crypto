import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { useFavoritesStore } from '../state/favorites-store';
import { useMarketStore } from '../state/market-store';
import { ConnectionBanner } from './ConnectionBanner';
import { filterWatchlistPairs, resolveWatchlistPairs } from './filter-watchlist';
import { WatchlistRow } from './WatchlistRow';

interface WatchlistScreenProps {
  wsConfigured: boolean;
}

export function WatchlistScreen({ wsConfigured }: WatchlistScreenProps) {
  const [query, setQuery] = useState('');
  const pairs = useMarketStore((state) => state.pairs);
  const metaError = useMarketStore((state) => state.metaError);
  const protocolError = useMarketStore((state) => state.protocolError);
  const persistError = useFavoritesStore((state) => state.persistError);

  const visible = useMemo(
    () => filterWatchlistPairs(resolveWatchlistPairs(pairs), query),
    [pairs, query],
  );

  return (
    <ScrollView
      testID="watchlist"
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title} testID="heading" role="heading">
        PulseCrypto
      </Text>
      <ConnectionBanner />
      {!wsConfigured ? (
        <Text style={styles.hint}>Set EXPO_PUBLIC_WS_URL to receive live prices.</Text>
      ) : null}
      {metaError ? <Text style={styles.error}>{metaError}</Text> : null}
      {protocolError ? <Text style={styles.error}>{protocolError}</Text> : null}
      {persistError ? <Text style={styles.error}>{persistError}</Text> : null}
      <TextInput
        testID="search-input"
        value={query}
        onChangeText={setQuery}
        placeholder="Search pairs"
        placeholderTextColor="#9ca3af"
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
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#111827',
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
  search: {
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
});
