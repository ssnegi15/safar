import { metrics } from '@opentelemetry/api';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';

let telemetrySdk: NodeSDK | undefined;

export async function startTelemetry(): Promise<void> {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return;
  const sdk = new NodeSDK({
    serviceName: 'safar-api',
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: new URL('/v1/metrics', endpoint).toString(),
      }),
    }),
  });
  await sdk.start();
  telemetrySdk = sdk;
}

export async function stopTelemetry(): Promise<void> {
  await telemetrySdk?.shutdown();
}

const meter = metrics.getMeter('safar-api');

export const httpRequestCount = meter.createCounter('safar_http_requests', {
  description: 'HTTP requests handled by the Safar API',
});

export const httpRequestDuration = meter.createHistogram('safar_http_request_duration_seconds', {
  description: 'HTTP request duration in seconds',
  unit: 's',
});
