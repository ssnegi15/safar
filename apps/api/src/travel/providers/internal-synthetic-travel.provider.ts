import { Injectable } from '@nestjs/common';
import type { AccommodationProvider } from './accommodation-provider';
import type { TravelSearchProvider } from './travel-search-provider';
import type {
  Destination,
  Property,
  PropertySearchQuery,
  PropertySearchResult,
  SearchRates,
} from '../travel.models';

type DestinationSeed = Omit<Destination, 'propertyCount' | 'isSynthetic'> & {
  latitude: number;
  longitude: number;
  nightlyBase: number;
};

const DESTINATIONS: DestinationSeed[] = [
  {
    id: 'goa',
    name: 'Goa',
    state: 'Goa',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    description: 'Sunlit beaches, Portuguese-era lanes, and relaxed coastal stays.',
    imageUrl:
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=85',
    latitude: 15.4909,
    longitude: 73.8278,
    nightlyBase: 6400,
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    description: 'A vibrant waterfront city shaped by food, film, and architecture.',
    imageUrl:
      'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=85',
    latitude: 19.076,
    longitude: 72.8777,
    nightlyBase: 7800,
  },
  {
    id: 'delhi',
    name: 'Delhi',
    state: 'Delhi',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    description: 'Historic monuments, leafy avenues, and a remarkable food scene.',
    imageUrl:
      'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=85',
    latitude: 28.6139,
    longitude: 77.209,
    nightlyBase: 5900,
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    description: 'Rose-hued palaces, artisan markets, and desert-edge heritage.',
    imageUrl:
      'https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=1200&q=85',
    latitude: 26.9124,
    longitude: 75.7873,
    nightlyBase: 5200,
  },
  {
    id: 'udaipur',
    name: 'Udaipur',
    state: 'Rajasthan',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    description: 'Lake palaces, sunset boat rides, and quiet old-city courtyards.',
    imageUrl:
      'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1200&q=85',
    latitude: 24.5854,
    longitude: 73.7125,
    nightlyBase: 6900,
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru',
    state: 'Karnataka',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    description: 'Garden-city mornings, contemporary design, and cafe culture.',
    imageUrl:
      'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1200&q=85',
    latitude: 12.9716,
    longitude: 77.5946,
    nightlyBase: 6100,
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad',
    state: 'Telangana',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    description: 'Qutb Shahi landmarks, lakeside escapes, and beloved local cuisine.',
    imageUrl:
      'https://images.unsplash.com/photo-1600650897815-3c3e9bf4c6b6?auto=format&fit=crop&w=1200&q=85',
    latitude: 17.385,
    longitude: 78.4867,
    nightlyBase: 5600,
  },
  {
    id: 'kochi',
    name: 'Kochi',
    state: 'Kerala',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    description: 'Harbour-side heritage, spice markets, and backwater day trips.',
    imageUrl:
      'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=85',
    latitude: 9.9312,
    longitude: 76.2673,
    nightlyBase: 4900,
  },
  {
    id: 'manali',
    name: 'Manali',
    state: 'Himachal Pradesh',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    description: 'Mountain air, pine forests, and trails in the upper Kullu valley.',
    imageUrl:
      'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=85',
    latitude: 32.2396,
    longitude: 77.1887,
    nightlyBase: 4300,
  },
  {
    id: 'kashmir',
    name: 'Kashmir',
    state: 'Jammu and Kashmir',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    description: 'Alpine lakes, cedar valleys, and stays close to the mountains.',
    imageUrl:
      'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=85',
    latitude: 34.0837,
    longitude: 74.7973,
    nightlyBase: 7600,
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    state: 'Uttar Pradesh',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    description: 'Ghat-side walks, dawn on the river, and centuries of craft.',
    imageUrl:
      'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1200&q=85',
    latitude: 25.3176,
    longitude: 82.9739,
    nightlyBase: 3800,
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    description: 'Coastal promenades, classical arts, and South Indian flavours.',
    imageUrl:
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1200&q=85',
    latitude: 13.0827,
    longitude: 80.2707,
    nightlyBase: 5300,
  },
  {
    id: 'pune',
    name: 'Pune',
    state: 'Maharashtra',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    description: 'Hill-fringed neighbourhoods, heritage forts, and creative energy.',
    imageUrl:
      'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1200&q=85',
    latitude: 18.5204,
    longitude: 73.8567,
    nightlyBase: 5100,
  },
  {
    id: 'ahmedabad',
    name: 'Ahmedabad',
    state: 'Gujarat',
    countryCode: 'IN',
    timezone: 'Asia/Kolkata',
    description: 'Stepwells, pol houses, and bold modern architecture.',
    imageUrl:
      'https://images.unsplash.com/photo-1595658658481-d53d3f999875?auto=format&fit=crop&w=1200&q=85',
    latitude: 23.0225,
    longitude: 72.5714,
    nightlyBase: 4500,
  },
];

const PROPERTY_PREFIXES = [
  'The Courtyard',
  'Monsoon House',
  'Saffron & Stone',
  'Palm & Pine',
  'The Old Quarter',
  'Riverlight',
  'Mango Grove',
  'Blue Door',
  'House of Banyan',
  'The Sunday Stay',
  'Copper Leaf',
  'Little Atlas',
  'Quiet Fig',
  'The Verandah',
];

const PROPERTY_TYPES: Property['propertyType'][] = [
  'hotel',
  'resort',
  'homestay',
  'guesthouse',
];

const AMENITIES = [
  'Wi-Fi',
  'Air conditioning',
  'Breakfast',
  'Pool',
  'Restaurant',
  'Parking',
  'Airport transfer',
  'Spa',
];

const PROPERTY_IMAGES = [
  'photo-1566073771259-6a8506099945',
  'photo-1564501049412-61c2a3083791',
  'photo-1542314831-068cd1dbfeeb',
  'photo-1571896349842-33c89424de2d',
  'photo-1582719478250-c89cae4dc85b',
  'photo-1611892440504-42a792e24d32',
];

function buildProperties(): Property[] {
  return DESTINATIONS.flatMap((destination, destinationIndex) =>
    [0, 1].map((variant) => {
      const index = destinationIndex * 2 + variant;
      const propertyType = PROPERTY_TYPES[index % PROPERTY_TYPES.length]!;
      const name = `${PROPERTY_PREFIXES[index % PROPERTY_PREFIXES.length]} ${
        destination.name
      }`;
      const selectedAmenities = AMENITIES.filter((_, amenityIndex) => {
        return (destinationIndex + variant + amenityIndex) % (variant === 0 ? 3 : 4) !== 0;
      });
      const baseImage = PROPERTY_IMAGES[index % PROPERTY_IMAGES.length]!;
      const rating = 3.8 + ((destinationIndex * 7 + variant * 5) % 12) / 10;

      return {
        id: `stay-${destination.id}-${variant + 1}`,
        name,
        description: `${name} pairs thoughtful local character with an easy base for exploring ${destination.name}.`,
        propertyType,
        starRating: 3 + ((destinationIndex + variant) % 3),
        rating: Math.min(4.9, Number(rating.toFixed(1))),
        reviewCount: 48 + ((destinationIndex * 37 + variant * 83) % 620),
        address: `${12 + destinationIndex * 7 + variant} ${variant ? 'Lake' : 'Market'} Road`,
        city: destination.name,
        state: destination.state,
        countryCode: destination.countryCode,
        latitude: destination.latitude + (variant === 0 ? 0.018 : -0.021),
        longitude: destination.longitude + (variant === 0 ? -0.014 : 0.019),
        amenities: selectedAmenities,
        images: [
          {
            url: `https://images.unsplash.com/${baseImage}?auto=format&fit=crop&w=1400&q=85`,
            alt: `${name}, a synthetic demo ${propertyType} in ${destination.name}`,
          },
          {
            url: `https://images.unsplash.com/${
              PROPERTY_IMAGES[(index + 2) % PROPERTY_IMAGES.length]!
            }?auto=format&fit=crop&w=1400&q=85`,
            alt: `A shared space at ${name}`,
          },
        ],
        rooms: [
          {
            id: `room-${destination.id}-${variant + 1}-garden`,
            name: 'Garden room',
            maxOccupancy: 2,
            bedConfiguration: '1 queen bed',
            amenities: ['Wi-Fi', 'Air conditioning', 'Tea and coffee'],
            cancellationPolicy: 'Free cancellation until 48 hours before check-in',
          },
          {
            id: `room-${destination.id}-${variant + 1}-deluxe`,
            name: 'Deluxe room',
            maxOccupancy: 3,
            bedConfiguration: '1 king bed',
            amenities: ['Wi-Fi', 'Air conditioning', 'Breakfast'],
            cancellationPolicy: 'Free cancellation until 72 hours before check-in',
          },
          {
            id: `room-${destination.id}-${variant + 1}-family`,
            name: 'Family suite',
            maxOccupancy: 4,
            bedConfiguration: '1 king bed and 1 sofa bed',
            amenities: ['Wi-Fi', 'Air conditioning', 'Breakfast', 'Lounge area'],
            cancellationPolicy: 'Non-refundable',
          },
        ],
        isSynthetic: true,
      };
    }),
  );
}

const PROPERTIES = buildProperties();

@Injectable()
export class InternalSyntheticTravelProvider
  implements AccommodationProvider, TravelSearchProvider
{
  async searchProperties(query: PropertySearchQuery): Promise<PropertySearchResult[]> {
    const normalizedDestination = query.destination?.trim().toLocaleLowerCase('en-IN');
    const results = PROPERTIES.flatMap((property) => {
      if (
        normalizedDestination &&
        !`${property.city} ${property.state}`.toLocaleLowerCase('en-IN').includes(
          normalizedDestination,
        )
      ) {
        return [];
      }
      if (query.propertyType && property.propertyType !== query.propertyType) return [];
      if (query.minRating && property.rating < query.minRating) return [];
      if (query.minStarRating && property.starRating < query.minStarRating) return [];
      if (!query.amenities.every((amenity) => property.amenities.includes(amenity))) return [];

      const rate = this.getRate(
        property.id,
        property.city,
        property.starRating,
        query.guests,
        query.checkIn,
        query.checkOut,
      );
      if (query.minPrice !== undefined && rate.amountPerNight < query.minPrice) return [];
      if (query.maxPrice !== undefined && rate.amountPerNight > query.maxPrice) return [];
      return [{ property, rate }];
    });

    switch (query.sort) {
      case 'price_asc':
        results.sort((a, b) => a.rate.amountPerNight - b.rate.amountPerNight);
        break;
      case 'price_desc':
        results.sort((a, b) => b.rate.amountPerNight - a.rate.amountPerNight);
        break;
      case 'rating':
        results.sort((a, b) => b.property.rating - a.property.rating);
        break;
      case 'popularity':
        results.sort((a, b) => b.property.reviewCount - a.property.reviewCount);
        break;
      default:
        results.sort((a, b) => {
          const destinationMatch = normalizedDestination
            ? Number(a.property.city.toLocaleLowerCase('en-IN') !== normalizedDestination) -
              Number(b.property.city.toLocaleLowerCase('en-IN') !== normalizedDestination)
            : 0;
          return destinationMatch || a.property.name.localeCompare(b.property.name);
        });
    }

    return results.map(({ property, rate }) => ({
      property: this.toSummary(property),
      rate,
    }));
  }

  async getProperty(propertyId: string): Promise<Property | undefined> {
    return PROPERTIES.find((property) => property.id === propertyId);
  }

  async getDestinations(): Promise<Destination[]> {
    return DESTINATIONS.map((destination) => ({
      id: destination.id,
      name: destination.name,
      state: destination.state,
      countryCode: destination.countryCode,
      timezone: destination.timezone,
      description: destination.description,
      imageUrl: destination.imageUrl,
      propertyCount: PROPERTIES.filter((property) => property.city === destination.name).length,
      isSynthetic: true,
    }));
  }

  async getAvailability(
    propertyId: string,
    guests: number,
    checkIn?: string,
    checkOut?: string,
  ): Promise<SearchRates | undefined> {
    const property = PROPERTIES.find((item) => item.id === propertyId);
    if (!property) return undefined;
    return this.getRate(
      property.id,
      property.city,
      property.starRating,
      guests,
      checkIn,
      checkOut,
    );
  }

  private getRate(
    propertyId: string,
    city: string,
    starRating: number,
    guests: number,
    checkIn?: string,
    checkOut?: string,
  ): SearchRates {
    const destination = DESTINATIONS.find((item) => item.name === city)!;
    const variant = Number(propertyId.slice(-1));
    const travelDay = checkIn ? new Date(`${checkIn}T00:00:00.000Z`).getUTCDate() : 15;
    const seasonAdjustment = ((travelDay + propertyId.length) % 5) * 175;
    const amountPerNight =
      destination.nightlyBase +
      starRating * 360 +
      variant * 475 +
      Math.max(0, guests - 1) * 350 +
      seasonAdjustment;
    const stayNights =
      checkIn && checkOut
        ? Math.max(1, (Date.parse(`${checkOut}T00:00:00.000Z`) - Date.parse(`${checkIn}T00:00:00.000Z`)) / 86_400_000)
        : 1;
    const inventorySeed = travelDay + propertyId.charCodeAt(propertyId.length - 2) + stayNights;
    const availableRooms = (inventorySeed % 7) + 1;

    return {
      currency: 'INR',
      amountPerNight,
      taxesAndFees: Math.round(amountPerNight * 0.12),
      availability: availableRooms <= 2 ? 'limited' : 'available',
      availableRooms,
      sampledAt: new Date().toISOString(),
    };
  }

  private toSummary(property: Property): Omit<Property, 'rooms'> {
    const { rooms, ...summary } = property;
    void rooms;
    return summary;
  }
}
