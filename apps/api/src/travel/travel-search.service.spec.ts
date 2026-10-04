import { InternalSyntheticTravelProvider } from './providers/internal-synthetic-travel.provider';
import { TravelSearchService } from './travel-search.service';

describe('TravelSearchService', () => {
  const provider = new InternalSyntheticTravelProvider();
  const service = new TravelSearchService(provider, provider);

  it('returns deterministic, paginated synthetic properties', async () => {
    const result = await service.search({
      guests: 2,
      amenities: [],
      sort: 'price_asc',
      page: 1,
      pageSize: 5,
    });

    expect(result.items).toHaveLength(5);
    expect(result.total).toBe(28);
    expect(result.items[0]?.rate.currency).toBe('INR');
    expect(result.items[0]?.property.isSynthetic).toBe(true);
  });

  it('applies destination, property type, rating, and amenity filters', async () => {
    const result = await service.search({
      destination: 'Goa',
      guests: 2,
      propertyType: 'resort',
      minRating: 4,
      amenities: ['Wi-Fi'],
      sort: 'rating',
      page: 1,
      pageSize: 10,
    });

    expect(result.items.length).toBeGreaterThan(0);
    expect(
      result.items.every(
        ({ property }) =>
          property.city === 'Goa' &&
          property.propertyType === 'resort' &&
          property.rating >= 4 &&
          property.amenities.includes('Wi-Fi'),
      ),
    ).toBe(true);
  });

  it('returns room details for a property and not-found for an unknown id', async () => {
    const property = await service.getProperty('stay-goa-1');
    expect(property.rooms).toHaveLength(3);
    await expect(service.getProperty('missing')).rejects.toThrow('Property not found');
  });
});
