import type { PairMetadata } from '@pulse-crypto/contracts';

export const PAIR_METADATA_PROVIDER = Symbol('PAIR_METADATA_PROVIDER');

export interface PairMetadataProvider {
  getAll(): Promise<readonly PairMetadata[]>;
}
