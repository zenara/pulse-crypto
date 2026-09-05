import { Platform } from 'react-native';

/** Tokens from UI/PulseCrypto style guide PNGs. */
export const colors = {
  bg: '#0B0E14',
  surface: '#1E2633',
  surfaceAlt: '#141A24',
  border: '#2A3444',
  text: '#F4F6F8',
  muted: '#8B95A7',
  secondary: '#00C57A',
  secondaryDim: 'rgba(0, 197, 122, 0.16)',
  tertiary: '#FF3B69',
  tertiaryDim: 'rgba(255, 59, 105, 0.16)',
  warning: '#E8A317',
};

export const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});
