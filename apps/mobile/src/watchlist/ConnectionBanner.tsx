import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { useMarketStore } from '../state/market-store';
import { connectionStatusLabel } from './connection-status-label';

const STATUS_COLOR: Record<string, string> = {
  connected: colors.secondary,
  connecting: colors.warning,
  reconnecting: colors.warning,
  disconnected: colors.muted,
  error: colors.tertiary,
};

export function ConnectionBanner() {
  const status = useMarketStore((state) => state.connectionStatus);
  const color = STATUS_COLOR[status] ?? colors.muted;

  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text testID="connection-status" style={[styles.label, { color }]}>
        {connectionStatusLabel(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
