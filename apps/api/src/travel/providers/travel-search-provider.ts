import type {
  PropertySearchQuery,
  PropertySearchResult,
} from '../travel.models';

export interface TravelSearchProvider {
  searchProperties(query: PropertySearchQuery): Promise<PropertySearchResult[]>;
}
