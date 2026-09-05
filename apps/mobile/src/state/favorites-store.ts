import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { TradingPair } from '@pulse-crypto/contracts';
import {
  createAsyncStorageFavoritesStorage,
  loadFavorites,
  saveFavorites,
  type FavoritesStorage,
} from '../storage/favorites-storage';

export interface FavoritesStoreState {
  favorites: TradingPair[];
  hydrated: boolean;
  persistError: string | undefined;
  hydrate: () => Promise<void>;
  toggleFavorite: (pair: TradingPair) => Promise<void>;
  isFavorite: (pair: TradingPair) => boolean;
}

export type FavoritesStore = UseBoundStore<StoreApi<FavoritesStoreState>>;

export function createFavoritesStore(storage: FavoritesStorage): FavoritesStore {
  return create<FavoritesStoreState>((set, get) => ({
    favorites: [],
    hydrated: false,
    persistError: undefined,
    hydrate: async () => {
      try {
        const favorites = await loadFavorites(storage);
        set({ favorites, hydrated: true, persistError: undefined });
      } catch {
        set({
          favorites: [],
          hydrated: true,
          persistError: 'Unable to restore favourites',
        });
      }
    },
    toggleFavorite: async (pair) => {
      const previous = get().favorites;
      const next = previous.includes(pair)
        ? previous.filter((item) => item !== pair)
        : [...previous, pair];
      set({ favorites: next, persistError: undefined });
      try {
        await saveFavorites(storage, next);
      } catch {
        set({
          favorites: previous,
          persistError: 'Unable to save favourites',
        });
      }
    },
    isFavorite: (pair) => get().favorites.includes(pair),
  }));
}

export const useFavoritesStore = createFavoritesStore(
  createAsyncStorageFavoritesStorage(),
);

export function resetFavoritesStore(): void {
  useFavoritesStore.setState({
    favorites: [],
    hydrated: false,
    persistError: undefined,
  });
}
