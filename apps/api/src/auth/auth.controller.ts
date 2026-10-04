import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { APP_CONFIG } from './auth.tokens';
import { AuthService } from './auth.service';
import { BearerAuthGuard } from './bearer-auth.guard';
import { CurrentPrincipal } from './current-principal.decorator';
import type { AuthenticatedPrincipal } from './auth.types';
import type { AppConfig } from '../config';
import { isAdminPrincipal } from './admin-auth.guard';

@ApiTags('auth')
@ApiBearerAuth()
@UseGuards(BearerAuthGuard)
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the signed-in user and server-resolved personal tenant' })
  async getCurrentUser(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    const user = await this.authService.getCurrentUser(principal);
    return {
      ...user,
      emailVerified: principal.emailVerified === true,
      isAdmin: isAdminPrincipal(principal, this.config.adminEmails),
    };
  }
}
