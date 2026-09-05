import { create } from 'zustand';
import type {
  ConnectionStatus,
  MarketState,
  PairMetadata,
  TradingPair,
} from '@pulse-crypto/contracts';

export type MarketsByPair = Partial<Record<TradingPair, MarketState>>;

export interface MarketStoreState {
  connectionStatus: ConnectionStatus;
  markets: MarketsByPair;
  pairs: PairMetadata[];
  metaLoading: boolean;
  metaError: string | undefined;
  protocolError: string | undefined;
  setConnectionStatus: (status: ConnectionStatus) => void;
  applySnapshot: (states: readonly MarketState[]) => void;
  beginMetaLoad: () => void;
  setPairs: (pairs: readonly PairMetadata[]) => void;
  setMetaError: (message: string | undefined) => void;
  setProtocolError: (message: string | undefined) => void;
}

const initialState = {
  connectionStatus: 'disconnected' as ConnectionStatus,
  markets: {} as MarketsByPair,
  pairs: [] as PairMetadata[],
  metaLoading: false,
  metaError: undefined as string | undefined,
  protocolError: undefined as string | undefined,
};

export const useMarketStore = create<MarketStoreState>((set) => ({
  ...initialState,
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  applySnapshot: (states) =>
    set((current) => {
      if (states.length === 0) {
        return current;
      }
      const markets: MarketsByPair = { ...current.markets };
      for (const state of states) {
        markets[state.pair] = state;
      }
      return { markets };
    }),
  beginMetaLoad: () => set({ metaLoading: true }),
  setPairs: (pairs) => set({ pairs: [...pairs], metaError: undefined, metaLoading: false }),
  setMetaError: (metaError) => set({ metaError, metaLoading: false }),
  setProtocolError: (protocolError) => set({ protocolError }),
}));

export function resetMarketStore(): void {
  useMarketStore.setState({
    connectionStatus: initialState.connectionStatus,
    markets: {},
    pairs: [],
    metaLoading: false,
    metaError: undefined,
    protocolError: undefined,
  });
}

export function selectMarket(pair: TradingPair) {
  return (state: MarketStoreState) => state.markets[pair];
}
