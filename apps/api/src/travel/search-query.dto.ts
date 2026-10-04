import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Property } from './travel.models';

const PROPERTY_TYPES: Property['propertyType'][] = [
  'hotel',
  'resort',
  'homestay',
  'guesthouse',
];

const SORT_OPTIONS = ['relevance', 'price_asc', 'price_desc', 'rating', 'popularity'] as const;

export class SearchPropertiesDto {
  @ApiPropertyOptional({ description: 'Destination city or state', example: 'Goa' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  destination?: string;

  @ApiPropertyOptional({ description: 'Check-in date in YYYY-MM-DD form', example: '2026-11-12' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  checkIn?: string;

  @ApiPropertyOptional({ description: 'Check-out date in YYYY-MM-DD form', example: '2026-11-15' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  checkOut?: string;

  @ApiProperty({ minimum: 1, maximum: 12, default: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  guests = 2;

  @ApiPropertyOptional({ minimum: 0, maximum: 1_000_000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  minPrice?: number;

  @ApiPropertyOptional({ minimum: 0, maximum: 1_000_000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: PROPERTY_TYPES })
  @IsOptional()
  @IsIn(PROPERTY_TYPES)
  propertyType?: Property['propertyType'];

  @ApiPropertyOptional({ minimum: 0, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5, description: 'Minimum property star rating' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  minStarRating?: number;

  @ApiPropertyOptional({ type: [String], example: ['Wi-Fi', 'Breakfast'] })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map(String)
      : typeof value === 'string'
        ? value.split(',')
        : [],
  )
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  amenities: string[] = [];

  @ApiPropertyOptional({
    enum: [...SORT_OPTIONS],
    default: 'relevance',
  })
  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sort: (typeof SORT_OPTIONS)[number] = 'relevance';

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 12;
}
