import {
  parseFavorites,
  loadFavorites,
  saveFavorites,
  type FavoritesStorage,
} from './favorites-storage';

function memoryStorage(initial: string | null = null): FavoritesStorage & {
  value: string | null;
} {
  const storage = {
    value: initial,
    getItem: async () => storage.value,
    setItem: async (value: string) => {
      storage.value = value;
    },
  };
  return storage;
}

describe('favorites storage', () => {
  it('keeps supported pairs and drops duplicates and unknown symbols', () => {
    expect(
      parseFavorites(['BTCUSDT', 'BTCUSDT', 'ADAUSDT', 1, 'ETHUSDT']),
    ).toEqual(['BTCUSDT', 'ETHUSDT']);
  });

  it('treats missing or invalid JSON as an empty list', async () => {
    await expect(loadFavorites(memoryStorage(null))).resolves.toEqual([]);
    await expect(loadFavorites(memoryStorage('{'))).resolves.toEqual([]);
    await expect(loadFavorites(memoryStorage('"BTCUSDT"'))).resolves.toEqual([]);
  });

  it('round-trips a favourites list', async () => {
    const storage = memoryStorage();
    await saveFavorites(storage, ['SOLUSDT', 'XRPUSDT']);
    await expect(loadFavorites(storage)).resolves.toEqual(['SOLUSDT', 'XRPUSDT']);
  });
});
