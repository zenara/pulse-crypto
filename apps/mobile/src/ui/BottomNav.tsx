import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export type AppTab = 'markets' | 'terminal';

interface BottomNavProps {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <View style={styles.bar}>
      <NavItem
        label="Markets"
        testID="tab-markets"
        active={active === 'markets'}
        onPress={() => onChange('markets')}
      />
      <NavItem
        label="Terminal"
        testID="tab-terminal"
        active={active === 'terminal'}
        onPress={() => onChange('terminal')}
      />
    </View>
  );
}

function NavItem({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.item, active && styles.itemActive]}
    >
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  itemActive: {
    backgroundColor: colors.secondaryDim,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    letterSpacing: 0.4,
  },
  labelActive: {
    color: colors.secondary,
  },
});
