import { Injectable } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { stopTelemetry } from './telemetry';

@Injectable()
export class TelemetryLifecycleService implements OnApplicationShutdown {
  onApplicationShutdown(): Promise<void> {
    return stopTelemetry();
  }
}
