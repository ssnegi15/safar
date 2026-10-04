import { Badge, Button, Group, Text, Tooltip } from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Heart, MapPin, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchFavoriteIds, removeFavorite, saveFavorite } from '../api';
import type { PropertySearchResult } from '../api';
import { useAuth } from '../auth/AuthProvider';

const rupees = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function PropertyCard({ result }: { result: PropertySearchResult }) {
  const { property, rate } = result;
  const hero = property.images[0];
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const favorites = useQuery({
    queryKey: ['favorites'],
    queryFn: fetchFavoriteIds,
    enabled: Boolean(user),
  });
  const isFavorite = favorites.data?.includes(property.id) ?? false;
  const favoriteMutation = useMutation({
    mutationFn: (): Promise<{ propertyId: string; saved: boolean }> =>
      isFavorite ? removeFavorite(property.id) : saveFavorite(property.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  return (
    <article className="property-card">
      <Link to={`/hotels/${property.id}`} className="property-image-link" aria-label={`View ${property.name}`}>
        <img
          className="property-image"
          src={hero?.url}
          alt={hero?.alt ?? property.name}
          loading="lazy"
        />
        <Badge className="property-type" variant="white" color="dark" radius="xl">
          {property.propertyType}
        </Badge>
        {user ? (
          <Tooltip label={favoriteMutation.error?.message ?? (isFavorite ? 'Remove from saved stays' : 'Save this stay')}>
            <Button
              className={isFavorite ? 'favorite-toggle is-favorite' : 'favorite-toggle'}
              variant="white"
              radius="xl"
              size="compact-sm"
              aria-label={isFavorite ? `Remove ${property.name} from favorites` : `Save ${property.name} to favorites`}
              aria-pressed={isFavorite}
              loading={favoriteMutation.isPending}
              disabled={favorites.isPending}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                favoriteMutation.mutate();
              }}
            >
              <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
            </Button>
          </Tooltip>
        ) : (
          <Tooltip label="Sign in to save this stay">
            <Button
              component={Link}
              to="/login"
              className="favorite-toggle"
              variant="white"
              radius="xl"
              size="compact-sm"
              aria-label={`Sign in to save ${property.name}`}
            >
              <Heart size={17} />
            </Button>
          </Tooltip>
        )}
      </Link>
      <div className="property-card-body">
        <Group justify="space-between" align="flex-start" gap="xs" wrap="nowrap">
          <div>
            <Text fw={650} className="property-name">
              {property.name}
            </Text>
            <Text size="sm" c="dimmed" className="property-location">
              <MapPin size={14} aria-hidden="true" /> {property.city}, {property.state}
            </Text>
          </div>
          <span className="property-rating">
            <Star size={14} fill="currentColor" aria-hidden="true" /> {property.rating.toFixed(1)}
          </span>
        </Group>
        <div className="property-card-bottom">
          <div>
            <span className="price-value">₹{rupees.format(rate.amountPerNight)}</span>
            <span className="price-unit"> / night</span>
            <Text size="xs" c="dimmed">
              + ₹{rupees.format(rate.taxesAndFees)} taxes
            </Text>
          </div>
          <Button
            component={Link}
            to={`/hotels/${property.id}`}
            variant="subtle"
            color="dark"
            size="compact-sm"
            rightSection={<ArrowUpRight size={15} />}
            aria-label={`View ${property.name}`}
          >
            Explore
          </Button>
        </div>
      </div>
    </article>
  );
}
