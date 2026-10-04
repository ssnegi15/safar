import 'dotenv/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { RequestContextMiddleware } from './common/request-context.middleware';
import { startTelemetry } from './common/telemetry';
import { loadConfig } from './config';

async function bootstrap(): Promise<void> {
  const config = loadConfig(process.env);
  await startTelemetry();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(new Logger());
  app.use(helmet());
  app.enableCors({ origin: config.webOrigin, credentials: false });
  app.use(new RequestContextMiddleware().use);
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Safar Travel API')
    .setDescription('Public travel discovery API. Inventory is synthetic demo data.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(config.apiPort);
  Logger.log(`API listening on http://localhost:${config.apiPort}/api/v1`, 'Bootstrap');
}

void bootstrap();
