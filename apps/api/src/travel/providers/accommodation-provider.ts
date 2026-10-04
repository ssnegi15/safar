import type {
  Destination,
  Property,
  PropertySearchQuery,
  PropertySearchResult,
  SearchRates,
} from '../travel.models';

export interface AccommodationProvider {
  searchProperties(query: PropertySearchQuery): Promise<PropertySearchResult[]>;
  getProperty(propertyId: string): Promise<Property | undefined>;
  getDestinations(): Promise<Destination[]>;
  getAvailability(
    propertyId: string,
    guests: number,
    checkIn?: string,
    checkOut?: string,
  ): Promise<SearchRates | undefined>;
}
