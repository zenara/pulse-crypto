import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useMarketStore } from '../state/market-store';
import { connectionStatusLabel } from './connection-status-label';

const STATUS_COLOR: Record<string, string> = {
  connected: '#15803d',
  connecting: '#b45309',
  reconnecting: '#b45309',
  disconnected: '#6b7280',
  error: '#b91c1c',
};

export function ConnectionBanner() {
  const status = useMarketStore((state) => state.connectionStatus);

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.dot,
          { backgroundColor: STATUS_COLOR[status] ?? STATUS_COLOR.disconnected },
        ]}
      />
      <Text testID="connection-status" style={styles.label}>
        {connectionStatusLabel(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    fontSize: 15,
    color: '#4b5563',
  },
});
