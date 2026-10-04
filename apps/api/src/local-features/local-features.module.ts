import { Module } from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { BearerAuthGuard } from '../auth/bearer-auth.guard';
import { AuthModule } from '../auth/auth.module';
import { loadConfig } from '../config';
import { TravelModule } from '../travel/travel.module';
import {
  AdminBookingsController,
  AdminJourneyController,
  BookingsController,
  JourneyEventsController,
} from './booking-journey.controller';
import { FavoritesController, TripsController } from './local-features.controller';
import { LocalFeaturesRepository } from './local-features.repository';

@Module({
  imports: [AuthModule, TravelModule],
  controllers: [
    TripsController,
    FavoritesController,
    BookingsController,
    JourneyEventsController,
    AdminJourneyController,
    AdminBookingsController,
  ],
  providers: [
    BearerAuthGuard,
    AdminAuthGuard,
    {
      provide: LocalFeaturesRepository,
      useFactory: () => new LocalFeaturesRepository(loadConfig(process.env).database),
    },
  ],
})
export class LocalFeaturesModule {}
