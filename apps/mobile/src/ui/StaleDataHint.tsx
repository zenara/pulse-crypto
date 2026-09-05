import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors } from '../theme';
import { useMarketStore } from '../state/market-store';

export function StaleDataHint() {
  const status = useMarketStore((state) => state.connectionStatus);
  const hasMarkets = useMarketStore(
    (state) => Object.keys(state.markets).length > 0,
  );

  if (!hasMarkets) {
    return null;
  }
  if (status === 'connected' || status === 'connecting') {
    return null;
  }

  return (
    <Text testID="stale-data-hint" style={styles.hint}>
      Showing last received prices
    </Text>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginTop: 8,
    fontSize: 13,
    color: colors.warning,
  },
});
