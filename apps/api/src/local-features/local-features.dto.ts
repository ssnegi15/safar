import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const EVENT_TYPES = ['activity', 'flight', 'train', 'hotel', 'transfer', 'other'] as const;

export class CreateTripDto {
  @ApiProperty({ maxLength: 100 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ maxLength: 100 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  destination!: string;

  @ApiProperty({ format: 'date' })
  @IsDateString({ strict: true })
  startDate!: string;

  @ApiProperty({ format: 'date' })
  @IsDateString({ strict: true })
  endDate!: string;
}

export class CreateItineraryEventDto {
  @ApiProperty({ enum: EVENT_TYPES })
  @IsIn(EVENT_TYPES)
  eventType!: (typeof EVENT_TYPES)[number];

  @ApiProperty({ maxLength: 120 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ maxLength: 160 })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  location?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  startAt!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  endAt!: string;
}

export class SaveFavoriteDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  propertyId!: string;
}

export class CreateBookingDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  propertyId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  roomId!: string;

  @ApiProperty({ format: 'date' })
  @IsDateString({ strict: true })
  checkIn!: string;

  @ApiProperty({ format: 'date' })
  @IsDateString({ strict: true })
  checkOut!: string;

  @ApiProperty({ minimum: 1, maximum: 12 })
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(12)
  guests!: number;

  @ApiProperty({ enum: ['demo_card', 'demo_upi'] })
  @IsIn(['demo_card', 'demo_upi'])
  paymentMethod!: 'demo_card' | 'demo_upi';
}

export class CreateJourneyEventDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  eventId!: string;

  @ApiProperty({ enum: ['property_viewed', 'booking_started'] })
  @IsIn(['property_viewed', 'booking_started'])
  eventType!: 'property_viewed' | 'booking_started';

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  propertyId!: string;
}
