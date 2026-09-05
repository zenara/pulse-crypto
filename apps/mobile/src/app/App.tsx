import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import type { TradingPair } from '@pulse-crypto/contracts';
import { readMobileEnv } from '../config/env';
import { MarketDetailsScreen } from '../details/MarketDetailsScreen';
import { MarketSession } from '../session/market-session';
import { WatchlistScreen } from '../watchlist/WatchlistScreen';

export const App = () => {
  const env = useMemo(() => readMobileEnv(), []);
  const [selectedPair, setSelectedPair] = useState<TradingPair | undefined>();

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
      {selectedPair ? (
        <MarketDetailsScreen
          pair={selectedPair}
          onBack={() => setSelectedPair(undefined)}
        />
      ) : (
        <WatchlistScreen
          wsConfigured={Boolean(env.wsUrl)}
          onSelectPair={setSelectedPair}
        />
      )}
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
