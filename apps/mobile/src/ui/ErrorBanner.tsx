import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  testID?: string;
}

export function ErrorBanner({ message, onRetry, testID }: ErrorBannerProps) {
  return (
    <View style={styles.box} testID={testID}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable
          testID="retry-meta"
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={styles.retry}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tertiary,
    backgroundColor: colors.tertiaryDim,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: colors.tertiary,
  },
  retry: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
});
