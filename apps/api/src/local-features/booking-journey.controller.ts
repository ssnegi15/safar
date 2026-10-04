import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { AuthService } from '../auth/auth.service';
import { BearerAuthGuard } from '../auth/bearer-auth.guard';
import { CurrentPrincipal } from '../auth/current-principal.decorator';
import type { AuthenticatedPrincipal } from '../auth/auth.types';
import { TravelSearchService } from '../travel/travel-search.service';
// Nest's ValidationPipe requires these DTO classes at runtime for decorator metadata.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CreateBookingDto, CreateJourneyEventDto } from './local-features.dto';
import { LocalFeaturesRepository } from './local-features.repository';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(BearerAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(LocalFeaturesRepository) private readonly repository: LocalFeaturesRepository,
    @Inject(TravelSearchService) private readonly travelSearchService: TravelSearchService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a synthetic demo booking with a simulated payment' })
  async create(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() dto: CreateBookingDto,
  ) {
    if (dto.checkOut <= dto.checkIn) {
      throw new BadRequestException('Check-out must be after check-in');
    }
    if (dto.checkIn < new Date().toISOString().slice(0, 10)) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }

    const user = await this.authService.getCurrentUser(principal);
    const property = await this.travelSearchService.getProperty(dto.propertyId);
    const room = property.rooms.find((candidate) => candidate.id === dto.roomId);
    if (!room) throw new BadRequestException('Selected room is not available for this property');
    if (dto.guests > room.maxOccupancy) {
      throw new BadRequestException(`This room accommodates up to ${room.maxOccupancy} guests`);
    }

    const rates = await this.travelSearchService.getAvailability(
      dto.propertyId,
      dto.guests,
      dto.checkIn,
      dto.checkOut,
    );
    if (rates.availableRooms < 1) {
      throw new BadRequestException('No rooms are available for those dates');
    }

    const nights = (Date.parse(`${dto.checkOut}T00:00:00Z`) - Date.parse(`${dto.checkIn}T00:00:00Z`))
      / 86_400_000;
    const booking = await this.repository.createBooking(user.tenant.id, {
      propertyId: property.id,
      propertyName: property.name,
      roomId: room.id,
      roomName: room.name,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      guests: dto.guests,
      amountPerNight: rates.amountPerNight,
      taxesAndFees: rates.taxesAndFees,
      totalAmount: nights * rates.amountPerNight + rates.taxesAndFees,
      paymentMethod: dto.paymentMethod,
    });
    return { ...booking, isSynthetic: true };
  }

  @Get(':bookingId')
  @ApiOperation({ summary: 'Get a booking in the signed-in user personal tenant' })
  async get(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Param('bookingId', new ParseUUIDPipe()) bookingId: string,
  ) {
    const user = await this.authService.getCurrentUser(principal);
    return { ...(await this.repository.getBooking(user.tenant.id, bookingId)), isSynthetic: true };
  }
}

@ApiTags('journey')
@ApiBearerAuth()
@UseGuards(BearerAuthGuard)
@Controller('journey/events')
export class JourneyEventsController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(LocalFeaturesRepository) private readonly repository: LocalFeaturesRepository,
    @Inject(TravelSearchService) private readonly travelSearchService: TravelSearchService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Record a signed-in property-view or booking-start event' })
  async create(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body() dto: CreateJourneyEventDto,
  ) {
    await this.travelSearchService.getProperty(dto.propertyId);
    const user = await this.authService.getCurrentUser(principal);
    await this.repository.recordJourneyEvent(user.tenant.id, dto);
    return { recorded: true };
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(BearerAuthGuard, AdminAuthGuard)
@Controller('admin/journey')
export class AdminJourneyController {
  constructor(
    @Inject(LocalFeaturesRepository) private readonly repository: LocalFeaturesRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get aggregated user and booking funnel metrics' })
  getStats() {
    return this.repository.getJourneyStats();
  }
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(BearerAuthGuard, AdminAuthGuard)
@Controller('admin/bookings')
export class AdminBookingsController {
  constructor(
    @Inject(LocalFeaturesRepository) private readonly repository: LocalFeaturesRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List the latest synthetic demo bookings without customer identifiers' })
  listBookings() {
    return this.repository.listAdminBookings();
  }
}
