import AsyncStorage from '@react-native-async-storage/async-storage';
import { isTradingPair, type TradingPair } from '@pulse-crypto/contracts';

export const FAVORITES_STORAGE_KEY = '@pulse-crypto/favorites';

export interface FavoritesStorage {
  getItem(): Promise<string | null>;
  setItem(value: string): Promise<void>;
}

export function createAsyncStorageFavoritesStorage(): FavoritesStorage {
  return {
    getItem: () => AsyncStorage.getItem(FAVORITES_STORAGE_KEY),
    setItem: (value) => AsyncStorage.setItem(FAVORITES_STORAGE_KEY, value),
  };
}

export function parseFavorites(value: unknown): TradingPair[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<TradingPair>();
  const favorites: TradingPair[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !isTradingPair(item) || seen.has(item)) {
      continue;
    }
    seen.add(item);
    favorites.push(item);
  }
  return favorites;
}

export async function loadFavorites(
  storage: FavoritesStorage,
): Promise<TradingPair[]> {
  const raw = await storage.getItem();
  if (!raw) {
    return [];
  }

  try {
    return parseFavorites(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export async function saveFavorites(
  storage: FavoritesStorage,
  favorites: readonly TradingPair[],
): Promise<void> {
  await storage.setItem(JSON.stringify(favorites));
}
