import type { FavoritesStorage } from '../storage/favorites-storage';
import { createFavoritesStore } from './favorites-store';

function memoryStorage(initial: string | null = null): FavoritesStorage & {
  value: string | null;
  failGet: boolean;
  failSet: boolean;
} {
  const storage = {
    value: initial,
    failGet: false,
    failSet: false,
    getItem: async () => {
      if (storage.failGet) {
        throw new Error('read failed');
      }
      return storage.value;
    },
    setItem: async (value: string) => {
      if (storage.failSet) {
        throw new Error('write failed');
      }
      storage.value = value;
    },
  };
  return storage;
}

describe('favorites store', () => {
  it('restores persisted favourites on hydrate', async () => {
    const storage = memoryStorage(JSON.stringify(['BTCUSDT', 'SOLUSDT']));
    const store = createFavoritesStore(storage);

    await store.getState().hydrate();

    expect(store.getState().favorites).toEqual(['BTCUSDT', 'SOLUSDT']);
    expect(store.getState().hydrated).toBe(true);
    expect(store.getState().isFavorite('BTCUSDT')).toBe(true);
    expect(store.getState().isFavorite('ETHUSDT')).toBe(false);
  });

  it('adds and removes a favourite and persists the result', async () => {
    const storage = memoryStorage();
    const store = createFavoritesStore(storage);

    await store.getState().toggleFavorite('ETHUSDT');
    expect(store.getState().favorites).toEqual(['ETHUSDT']);
    expect(storage.value).toBe(JSON.stringify(['ETHUSDT']));

    await store.getState().toggleFavorite('ETHUSDT');
    expect(store.getState().favorites).toEqual([]);
    expect(storage.value).toBe(JSON.stringify([]));
  });

  it('reverts an in-memory toggle when persistence fails', async () => {
    const storage = memoryStorage();
    storage.failSet = true;
    const store = createFavoritesStore(storage);

    await store.getState().toggleFavorite('XRPUSDT');

    expect(store.getState().favorites).toEqual([]);
    expect(store.getState().persistError).toBe('Unable to save favourites');
  });

  it('starts empty when restore fails', async () => {
    const storage = memoryStorage();
    storage.failGet = true;
    const store = createFavoritesStore(storage);

    await store.getState().hydrate();

    expect(store.getState().favorites).toEqual([]);
    expect(store.getState().hydrated).toBe(true);
    expect(store.getState().persistError).toBe('Unable to restore favourites');
  });
});
