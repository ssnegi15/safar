import { useQuery } from '@tanstack/react-query';
import { Button, Container, Group, MultiSelect, Select, Text, TextInput } from '@mantine/core';
import { ArrowDownWideNarrow, Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchProperties } from '../api';
import { LoadingCards } from '../ui/LoadingState';
import { PropertyCard } from '../ui/PropertyCard';
import { QueryError } from '../ui/QueryError';

const TYPE_OPTIONS = [
  { value: 'hotel', label: 'Hotel' },
  { value: 'resort', label: 'Resort' },
  { value: 'homestay', label: 'Homestay' },
  { value: 'guesthouse', label: 'Guesthouse' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Guest rating' },
  { value: 'popularity', label: 'Most reviewed' },
];
const AMENITY_OPTIONS = [
  'Wi-Fi',
  'Air conditioning',
  'Breakfast',
  'Pool',
  'Restaurant',
  'Parking',
  'Airport transfer',
  'Spa',
];

function tomorrowAfter(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [destination, setDestination] = useState(searchParams.get('destination') ?? '');
  const [guests, setGuests] = useState(searchParams.get('guests') ?? '2');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType'));
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') ?? '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') ?? '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating'));
  const [minStarRating, setMinStarRating] = useState(searchParams.get('minStarRating'));
  const [amenities, setAmenities] = useState(searchParams.get('amenities')?.split(',') ?? []);
  const [checkIn, setCheckIn] = useState(searchParams.get('checkIn') ?? '');
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') ?? '');
  const sort = searchParams.get('sort') ?? 'relevance';

  const canonicalParams = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    params.set('pageSize', '12');
    return params;
  }, [searchParams]);
  const properties = useQuery({
    queryKey: ['properties', canonicalParams.toString()],
    queryFn: () => fetchProperties(canonicalParams),
  });

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (destination.trim()) next.set('destination', destination.trim());
    if (checkIn) next.set('checkIn', checkIn);
    if (checkOut) next.set('checkOut', checkOut);
    next.set('guests', guests || '2');
    if (propertyType) next.set('propertyType', propertyType);
    if (minPrice) next.set('minPrice', minPrice);
    if (maxPrice) next.set('maxPrice', maxPrice);
    if (minRating) next.set('minRating', minRating);
    if (minStarRating) next.set('minStarRating', minStarRating);
    if (amenities.length) next.set('amenities', amenities.join(','));
    if (sort !== 'relevance') next.set('sort', sort);
    setSearchParams(next);
  }

  function setSort(value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'relevance') next.set('sort', value);
    else next.delete('sort');
    setSearchParams(next);
  }

  return (
    <Container size="xl" className="search-page">
      <div className="search-page-heading">
        <span className="overline">THE STAYS EDIT</span>
        <h1>Find your kind of place.</h1>
        <p>Independent-feeling stays, thoughtfully found across India.</p>
      </div>

      <form className="filter-bar" onSubmit={applyFilters} aria-label="Filter stays">
        <TextInput
          label="Destination"
          placeholder="Anywhere in India"
          leftSection={<Search size={15} />}
          value={destination}
          onChange={(event) => setDestination(event.currentTarget.value)}
        />
        <TextInput
          label="Guests"
          type="number"
          min={1}
          max={12}
          leftSection={<span className="filter-number">#</span>}
          value={guests}
          onChange={(event) => setGuests(event.currentTarget.value)}
        />
        <TextInput
          label="Check in"
          type="date"
          value={checkIn}
          onChange={(event) => {
            const nextCheckIn = event.currentTarget.value;
            setCheckIn(nextCheckIn);
            if (checkOut && checkOut <= nextCheckIn) {
              setCheckOut(tomorrowAfter(nextCheckIn));
            }
          }}
        />
        <TextInput
          label="Check out"
          type="date"
          min={checkIn ? tomorrowAfter(checkIn) : undefined}
          value={checkOut}
          onChange={(event) => setCheckOut(event.currentTarget.value)}
        />
        <Select
          label="Stay type"
          placeholder="Any type"
          clearable
          data={TYPE_OPTIONS}
          value={propertyType}
          onChange={setPropertyType}
        />
        <TextInput
          label="Min. nightly price"
          type="number"
          min={0}
          step={500}
          leftSection={<span className="filter-number">₹</span>}
          placeholder="No minimum"
          value={minPrice}
          onChange={(event) => setMinPrice(event.currentTarget.value)}
        />
        <TextInput
          label="Max. nightly price"
          type="number"
          min={0}
          step={500}
          leftSection={<span className="filter-number">₹</span>}
          placeholder="Any budget"
          value={maxPrice}
          onChange={(event) => setMaxPrice(event.currentTarget.value)}
        />
        <Select
          label="Guest rating"
          placeholder="Any rating"
          clearable
          data={[
            { value: '3.5', label: '3.5+' },
            { value: '4', label: '4.0+' },
            { value: '4.5', label: '4.5+' },
          ]}
          value={minRating}
          onChange={setMinRating}
        />
        <Select
          label="Property stars"
          placeholder="Any stars"
          clearable
          data={[
            { value: '2', label: '2+ stars' },
            { value: '3', label: '3+ stars' },
            { value: '4', label: '4+ stars' },
            { value: '5', label: '5 stars' },
          ]}
          value={minStarRating}
          onChange={setMinStarRating}
        />
        <MultiSelect
          label="Amenities"
          placeholder="Any amenities"
          data={AMENITY_OPTIONS}
          value={amenities}
          onChange={setAmenities}
          hidePickedOptions
        />
        <Button type="submit" leftSection={<SlidersHorizontal size={16} />} className="filter-submit">
          Apply filters
        </Button>
      </form>

      <div className="results-heading">
        <div>
          <h2>{searchParams.get('destination') || 'Places worth staying for'}</h2>
          {properties.isSuccess && (
            <Text c="dimmed" size="sm">
              {properties.data.total} {properties.data.total === 1 ? 'stay' : 'stays'} in synthetic demo inventory
            </Text>
          )}
        </div>
        <Group gap="xs" className="sort-control">
          <ArrowDownWideNarrow size={16} />
          <Select
            aria-label="Sort stays"
            data={SORT_OPTIONS}
            value={sort}
            onChange={setSort}
            allowDeselect={false}
            variant="unstyled"
            w={180}
          />
        </Group>
      </div>

      {properties.isPending ? (
        <LoadingCards />
      ) : properties.isError ? (
        <QueryError message={properties.error.message} onRetry={() => void properties.refetch()} />
      ) : properties.data.items.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon"><Search size={24} /></span>
          <h3>No stays found just yet.</h3>
          <p>Try a different destination or loosen one of your filters.</p>
          <Button
            variant="light"
            onClick={() => {
              setDestination('');
              setPropertyType(null);
              setMinPrice('');
              setMaxPrice('');
              setMinRating(null);
              setMinStarRating(null);
              setAmenities([]);
              setCheckIn('');
              setCheckOut('');
              setSearchParams(new URLSearchParams({ guests }));
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div className="property-grid">
            {properties.data.items.map((result) => (
              <PropertyCard key={result.property.id} result={result} />
            ))}
          </div>
          {properties.data.totalPages > 1 && (
            <div className="pagination-row">
              <Button
                variant="default"
                disabled={properties.data.page <= 1}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(properties.data.page - 1));
                  setSearchParams(next);
                }}
              >
                Previous
              </Button>
              <Text size="sm" c="dimmed">
                Page {properties.data.page} of {properties.data.totalPages}
              </Text>
              <Button
                variant="default"
                disabled={properties.data.page >= properties.data.totalPages}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(properties.data.page + 1));
                  setSearchParams(next);
                }}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
      <p className="demo-disclaimer">
        Rates and listings are synthetic examples for product demonstration only; no booking can be made.
      </p>
    </Container>
  );
}
