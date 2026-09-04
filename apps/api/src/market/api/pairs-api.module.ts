import { Module } from '@nestjs/common';
import { PairsMetaController } from './pairs-meta.controller';
import { PAIR_METADATA_PROVIDER } from './pair-metadata.provider';
import { StaticPairMetadataProvider } from './static-pair-metadata.provider';

@Module({
  controllers: [PairsMetaController],
  providers: [
    {
      provide: PAIR_METADATA_PROVIDER,
      useClass: StaticPairMetadataProvider,
    },
  ],
})
export class PairsApiModule {}
