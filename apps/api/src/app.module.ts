import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { LocalFeaturesModule } from './local-features/local-features.module';
import { TravelModule } from './travel/travel.module';
import { TelemetryInterceptor } from './common/telemetry.interceptor';
import { TelemetryLifecycleService } from './common/telemetry-lifecycle.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    AuthModule,
    LocalFeaturesModule,
    TravelModule,
  ],
  controllers: [HealthController],
  providers: [
    TelemetryLifecycleService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TelemetryInterceptor,
    },
  ],
})
export class AppModule {}
