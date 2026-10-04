import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../auth/auth.service';
import { BearerAuthGuard } from '../auth/bearer-auth.guard';
import { CurrentPrincipal } from '../auth/current-principal.decorator';
import type { AuthenticatedPrincipal } from '../auth/auth.types';
// Nest's ValidationPipe requires these DTO classes at runtime for decorator metadata.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CreateItineraryEventDto, CreateTripDto, SaveFavoriteDto } from './local-features.dto';
import { LocalFeaturesRepository } from './local-features.repository';
import type { ItineraryConflict } from './local-features.repository';

@ApiTags('trips')
@ApiBearerAuth()
@UseGuards(BearerAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(LocalFeaturesRepository) private readonly repository: LocalFeaturesRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List trips in the signed-in user personal tenant' })
  async list(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    const user = await this.authService.getCurrentUser(principal);
    return this.repository.listTrips(user.tenant.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a trip in the signed-in user personal tenant' })
  async create(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() dto: CreateTripDto,
  ) {
    if (dto.endDate <= dto.startDate) {
      throw new BadRequestException('Trip end date must be after its start date');
    }
    const user = await this.authService.getCurrentUser(principal);
    return this.repository.createTrip(user.tenant.id, dto);
  }

  @Get(':tripId')
  @ApiOperation({ summary: 'Get a trip and its itinerary' })
  async get(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
  ) {
    const user = await this.authService.getCurrentUser(principal);
    const [trip, events] = await Promise.all([
      this.repository.getTrip(user.tenant.id, tripId),
      this.repository.listEvents(user.tenant.id, tripId),
    ]);
    const conflicts = this.findConflicts(events);
    return { ...trip, events, conflicts };
  }

  @Post(':tripId/events')
  @ApiOperation({ summary: 'Add an itinerary event and report overlaps' })
  async createEvent(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
    @Body() dto: CreateItineraryEventDto,
  ) {
    if (Date.parse(dto.endAt) <= Date.parse(dto.startAt)) {
      throw new BadRequestException('Event end time must be after its start time');
    }
    const user = await this.authService.getCurrentUser(principal);
    return this.repository.createEvent(user.tenant.id, tripId, dto);
  }

  private findConflicts(
    events: Awaited<ReturnType<LocalFeaturesRepository['listEvents']>>,
  ) {
    const conflicts: ItineraryConflict[] = [];
    for (let left = 0; left < events.length; left += 1) {
      for (let right = left + 1; right < events.length; right += 1) {
        const first = events[left]!;
        const second = events[right]!;
        if (
          new Date(first.start_at).getTime() < new Date(second.end_at).getTime() &&
          new Date(second.start_at).getTime() < new Date(first.end_at).getTime()
        ) {
          conflicts.push({
            firstEventId: first.id,
            secondEventId: second.id,
            firstTitle: first.title,
            secondTitle: second.title,
            reason: 'overlapping_events' as const,
          });
        }
      }
    }
    return conflicts;
  }
}

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(BearerAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(LocalFeaturesRepository) private readonly repository: LocalFeaturesRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List saved property IDs' })
  async list(@CurrentPrincipal() principal: AuthenticatedPrincipal) {
    const user = await this.authService.getCurrentUser(principal);
    return this.repository.listFavoritePropertyIds(user.tenant.id);
  }

  @Post()
  @ApiOperation({ summary: 'Save a property to favorites' })
  async create(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() dto: SaveFavoriteDto,
  ) {
    const user = await this.authService.getCurrentUser(principal);
    await this.repository.saveFavorite(user.tenant.id, dto.propertyId);
    return { propertyId: dto.propertyId, saved: true };
  }

  @Delete(':propertyId')
  @ApiOperation({ summary: 'Remove a property from favorites' })
  async remove(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param('propertyId') propertyId: string,
  ) {
    const user = await this.authService.getCurrentUser(principal);
    await this.repository.removeFavorite(user.tenant.id, propertyId);
    return { propertyId, saved: false };
  }
}
