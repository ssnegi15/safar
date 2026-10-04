import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AccommodationProvider } from './providers/accommodation-provider';
import type { TravelSearchProvider } from './providers/travel-search-provider';
import {
  INTERNAL_SYNTHETIC_TRAVEL_PROVIDER,
  TRAVEL_SEARCH_PROVIDER,
} from './providers/provider.tokens';
import type {
  Destination,
  Page,
  Property,
  PropertySearchQuery,
  PropertySearchResult,
  SearchRates,
} from './travel.models';

@Injectable()
export class TravelSearchService {
  constructor(
    @Inject(INTERNAL_SYNTHETIC_TRAVEL_PROVIDER)
    private readonly provider: AccommodationProvider,
    @Inject(TRAVEL_SEARCH_PROVIDER)
    private readonly searchProvider: TravelSearchProvider,
  ) {}

  async search(query: PropertySearchQuery): Promise<Page<PropertySearchResult>> {
    if (Boolean(query.checkIn) !== Boolean(query.checkOut)) {
      throw new BadRequestException('Check-in and check-out dates must be provided together');
    }
    if (
      query.checkIn &&
      query.checkOut &&
      Date.parse(query.checkOut) <= Date.parse(query.checkIn)
    ) {
      throw new BadRequestException('Check-out must be after check-in');
    }
    if (!Number.isInteger(query.guests) || query.guests < 1 || query.guests > 12) {
      throw new BadRequestException('Guests must be between 1 and 12');
    }
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      throw new BadRequestException('Minimum price must not exceed maximum price');
    }

    const allResults = await this.searchProvider.searchProperties(query);
    const start = (query.page - 1) * query.pageSize;
    return {
      items: allResults.slice(start, start + query.pageSize),
      page: query.page,
      pageSize: query.pageSize,
      total: allResults.length,
      totalPages: Math.ceil(allResults.length / query.pageSize),
    };
  }

  async getProperty(propertyId: string): Promise<Property> {
    const property = await this.provider.getProperty(propertyId);
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async getAvailability(
    propertyId: string,
    guests: number,
    checkIn?: string,
    checkOut?: string,
  ): Promise<SearchRates> {
    if (Boolean(checkIn) !== Boolean(checkOut)) {
      throw new BadRequestException('Check-in and check-out dates must be provided together');
    }
    if (checkIn && checkOut && Date.parse(checkOut) <= Date.parse(checkIn)) {
      throw new BadRequestException('Check-out must be after check-in');
    }
    if (!Number.isInteger(guests) || guests < 1 || guests > 12) {
      throw new BadRequestException('Guests must be between 1 and 12');
    }

    const rates = await this.provider.getAvailability(propertyId, guests, checkIn, checkOut);
    if (!rates) throw new NotFoundException('Property not found');
    return rates;
  }

  getDestinations(): Promise<Destination[]> {
    return this.provider.getDestinations();
  }
}
