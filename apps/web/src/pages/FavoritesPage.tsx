import { useQuery } from '@tanstack/react-query';
import { Button, Container, Skeleton } from '@mantine/core';
import { Heart } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { fetchAvailability, fetchFavoriteIds, fetchProperty } from '../api';
import type { Property, PropertySearchResult } from '../api';
import { useAuth } from '../auth/AuthProvider';
import { PropertyCard } from '../ui/PropertyCard';
import { QueryError } from '../ui/QueryError';

export function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const favorites = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const ids = await fetchFavoriteIds();
      const results = await Promise.all(
        ids.map(async (id): Promise<PropertySearchResult> => {
          const [property, rate] = await Promise.all([
            fetchProperty(id),
            fetchAvailability(id, 2),
          ]);
          const summary: Omit<Property, 'rooms'> = {
            id: property.id,
            name: property.name,
            description: property.description,
            propertyType: property.propertyType,
            starRating: property.starRating,
            rating: property.rating,
            reviewCount: property.reviewCount,
            address: property.address,
            city: property.city,
            state: property.state,
            countryCode: property.countryCode,
            latitude: property.latitude,
            longitude: property.longitude,
            amenities: property.amenities,
            images: property.images,
            isSynthetic: property.isSynthetic,
          };
          return { property: summary, rate };
        }),
      );
      return results;
    },
    enabled: Boolean(user),
  });

  if (!authLoading && !user) return <Navigate to="/login" replace />;

  return (
    <Container size="xl" className="search-page">
      <span className="overline">YOUR SHORTLIST</span>
      <h1 className="feature-title">Stays you’ve saved.</h1>
      {authLoading || favorites.isPending ? (
        <div className="property-grid favorites-grid" aria-busy="true">
          <Skeleton height={330} radius="md" />
          <Skeleton height={330} radius="md" />
        </div>
      ) : favorites.isError ? (
        <QueryError message={favorites.error.message} onRetry={() => void favorites.refetch()} />
      ) : favorites.data.length === 0 ? (
        <div className="feature-empty">
          <Heart size={24} />
          <h3>Your shortlist is yours to shape.</h3>
          <p>Save a stay while browsing and it’ll be waiting here.</p>
          <Button component={Link} to="/search" className="filter-submit">Explore stays</Button>
        </div>
      ) : (
        <div className="property-grid favorites-grid">
          {favorites.data.map((result) => (
            <PropertyCard key={result.property.id} result={result} />
          ))}
        </div>
      )}
    </Container>
  );
}
