import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import type { TradingPair } from '@pulse-crypto/contracts';
import { colors } from '../theme';
import { readMobileEnv } from '../config/env';
import { MarketDetailsScreen } from '../details/MarketDetailsScreen';
import { MarketSession } from '../session/market-session';
import { BottomNav, type AppTab } from '../ui/BottomNav';
import { WatchlistScreen } from '../watchlist/WatchlistScreen';

export const App = () => {
  const env = useMemo(() => readMobileEnv(), []);
  const sessionRef = useRef<MarketSession | undefined>(undefined);
  const [selectedPair, setSelectedPair] = useState<TradingPair | undefined>();
  const [tab, setTab] = useState<AppTab>('markets');

  useEffect(() => {
    const session = new MarketSession({
      apiUrl: env.apiUrl,
      wsUrl: env.wsUrl,
    });
    sessionRef.current = session;
    session.start();
    return () => {
      session.stop();
      sessionRef.current = undefined;
    };
  }, [env.apiUrl, env.wsUrl]);

  const openPair = (pair: TradingPair) => {
    setSelectedPair(pair);
    setTab('terminal');
  };

  const showTerminal = tab === 'terminal' && selectedPair !== undefined;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.body}>
        {tab === 'terminal' && selectedPair ? (
          <MarketDetailsScreen
            pair={selectedPair}
            onBack={() => setTab('markets')}
          />
        ) : (
          <WatchlistScreen
            wsConfigured={Boolean(env.wsUrl)}
            onSelectPair={openPair}
            onRefreshMeta={() =>
              sessionRef.current?.refreshMeta() ?? Promise.resolve()
            }
          />
        )}
      </View>
      <BottomNav
        active={showTerminal ? 'terminal' : 'markets'}
        onChange={(next) => {
          if (next === 'terminal' && selectedPair === undefined) {
            return;
          }
          setTab(next);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 48,
  },
  body: {
    flex: 1,
  },
});

export default App;
