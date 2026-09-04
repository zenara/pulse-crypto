import {
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import type { PairsMetaResponse } from '@pulse-crypto/contracts';
import {
  PAIR_METADATA_PROVIDER,
  type PairMetadataProvider,
} from './pair-metadata.provider';

@Controller()
export class PairsMetaController {
  private readonly logger = new Logger(PairsMetaController.name);

  constructor(
    @Inject(PAIR_METADATA_PROVIDER)
    private readonly pairMetadata: PairMetadataProvider,
  ) {}

  @Get('pairs/meta')
  async getPairsMeta(): Promise<PairsMetaResponse> {
    try {
      const pairs = await this.pairMetadata.getAll();
      return { pairs: [...pairs] };
    } catch (error) {
      this.logger.error(
        'Failed to load pair metadata',
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException(
        'Unable to retrieve pair metadata',
      );
    }
  }
}
