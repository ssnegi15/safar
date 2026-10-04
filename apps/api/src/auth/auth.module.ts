import { Module } from '@nestjs/common';
import { loadConfig } from '../config';
import { AuthController } from './auth.controller';
import { APP_CONFIG, AUTH_CONFIG, IDENTITY_REPOSITORY } from './auth.tokens';
import { AuthService } from './auth.service';
import { BearerAuthGuard } from './bearer-auth.guard';
import { FirebaseIdentityRepository } from './firebase-identity.repository';
import { FirebaseIdTokenVerifier } from './firebase-id-token.verifier';
import { AdminAuthGuard } from './admin-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [
    {
      provide: APP_CONFIG,
      useFactory: () => loadConfig(process.env),
    },
    {
      provide: AUTH_CONFIG,
      inject: [APP_CONFIG],
      useFactory: (config: ReturnType<typeof loadConfig>) => config.firebase,
    },
    {
      provide: IDENTITY_REPOSITORY,
      inject: [APP_CONFIG],
      useFactory: (config: ReturnType<typeof loadConfig>) =>
        new FirebaseIdentityRepository(config.database),
    },
    AuthService,
    BearerAuthGuard,
    AdminAuthGuard,
    FirebaseIdTokenVerifier,
  ],
  exports: [APP_CONFIG, AuthService, BearerAuthGuard, AdminAuthGuard, FirebaseIdTokenVerifier],
})
export class AuthModule {}
