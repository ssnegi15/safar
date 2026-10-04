export type Destination = {
  id: string;
  name: string;
  state: string;
  countryCode: string;
  timezone: string;
  description: string;
  imageUrl: string;
  propertyCount: number;
  isSynthetic: true;
};

export type RoomType = {
  id: string;
  name: string;
  maxOccupancy: number;
  bedConfiguration: string;
  amenities: string[];
  cancellationPolicy: string;
};

export type Property = {
  id: string;
  name: string;
  description: string;
  propertyType: 'hotel' | 'resort' | 'homestay' | 'guesthouse';
  starRating: number;
  rating: number;
  reviewCount: number;
  address: string;
  city: string;
  state: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  images: { url: string; alt: string }[];
  rooms: RoomType[];
  isSynthetic: true;
};

export type SearchRates = {
  currency: 'INR';
  amountPerNight: number;
  taxesAndFees: number;
  availability: 'available' | 'limited';
  availableRooms: number;
  sampledAt: string;
};

export type PropertySearchResult = {
  property: Omit<Property, 'rooms'>;
  rate: SearchRates;
};

export type PropertySearchQuery = {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: Property['propertyType'];
  minRating?: number;
  minStarRating?: number;
  amenities: string[];
  sort: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'popularity';
  page: number;
  pageSize: number;
};

export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
