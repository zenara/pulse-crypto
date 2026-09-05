import React, { useEffect, useMemo } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { readMobileEnv } from '../config/env';
import { MarketSession } from '../session/market-session';
import { WatchlistScreen } from '../watchlist/WatchlistScreen';

export const App = () => {
  const env = useMemo(() => readMobileEnv(), []);

  useEffect(() => {
    const session = new MarketSession({
      apiUrl: env.apiUrl,
      wsUrl: env.wsUrl,
    });
    session.start();
    return () => {
      session.stop();
    };
  }, [env.apiUrl, env.wsUrl]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <WatchlistScreen wsConfigured={Boolean(env.wsUrl)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});

export default App;
