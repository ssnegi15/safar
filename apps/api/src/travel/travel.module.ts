import { Module } from '@nestjs/common';
import { DestinationsController } from './destinations.controller';
import { PropertiesController } from './properties.controller';
import {
  INTERNAL_SYNTHETIC_TRAVEL_PROVIDER,
  TRAVEL_SEARCH_PROVIDER,
} from './providers/provider.tokens';
import { InternalSyntheticTravelProvider } from './providers/internal-synthetic-travel.provider';
import { TravelSearchService } from './travel-search.service';

@Module({
  controllers: [DestinationsController, PropertiesController],
  providers: [
    TravelSearchService,
    {
      provide: INTERNAL_SYNTHETIC_TRAVEL_PROVIDER,
      useClass: InternalSyntheticTravelProvider,
    },
    {
      provide: TRAVEL_SEARCH_PROVIDER,
      useExisting: INTERNAL_SYNTHETIC_TRAVEL_PROVIDER,
    },
  ],
  exports: [TravelSearchService],
})
export class TravelModule {}
