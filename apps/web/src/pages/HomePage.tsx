import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Container,
  Group,
  Select,
  Text,
  TextInput,
} from '@mantine/core';
import { ArrowRight, CalendarDays, MapPin, Search, Sparkles, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchDestinations } from '../api';
import { QueryError } from '../ui/QueryError';

function todayAsInputValue(): string {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function dayAfter(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

export function HomePage() {
  const navigate = useNavigate();
  const [destination, setDestination] = useState<string | null>(null);
  const [checkIn, setCheckIn] = useState(daysFromToday(14));
  const [checkOut, setCheckOut] = useState(daysFromToday(17));
  const [guests, setGuests] = useState('2');
  const destinations = useQuery({ queryKey: ['destinations'], queryFn: fetchDestinations });
  const popularDestinations = useMemo(
    () => destinations.data?.slice(0, 6) ?? [],
    [destinations.data],
  );

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    params.set('guests', guests);
    navigate(`/search?${params.toString()}`);
  }

  return (
    <>
      <section className="hero">
        <div className="hero-photo" role="img" aria-label="A quiet Indian coastal landscape" />
        <div className="hero-shade" />
        <Container size="xl" className="hero-content">
          <div className="hero-copy">
            <Badge className="hero-eyebrow" leftSection={<Sparkles size={13} />}>
              YOUR NEXT GOOD STORY STARTS HERE
            </Badge>
            <h1>Go somewhere<br />that stays with you.</h1>
            <p>Find a stay that feels like part of the journey, not just a place to sleep.</p>
          </div>
          <form className="search-panel" onSubmit={search} aria-label="Search for a place to stay">
            <div className="search-field destination-field">
              <label htmlFor="destination">
                <MapPin size={16} /> Where to?
              </label>
              <Select
                id="destination"
                aria-label="Destination"
                placeholder="Choose a destination"
                searchable
                clearable
                data={(destinations.data ?? []).map((item) => ({
                  value: item.name,
                  label: item.name,
                }))}
                value={destination}
                onChange={setDestination}
                nothingFoundMessage={destinations.isPending ? 'Loading places…' : 'No places found'}
              />
            </div>
            <div className="search-field date-field">
              <label htmlFor="check-in">
                <CalendarDays size={16} /> Check in
              </label>
              <input
                id="check-in"
                type="date"
                min={todayAsInputValue()}
                value={checkIn}
                onChange={(event) => {
                  const nextCheckIn = event.target.value;
                  setCheckIn(nextCheckIn);
                  if (checkOut <= nextCheckIn) setCheckOut(dayAfter(nextCheckIn));
                }}
                required
              />
            </div>
            <div className="search-field date-field">
              <label htmlFor="check-out">
                <CalendarDays size={16} /> Check out
              </label>
              <input
                id="check-out"
                type="date"
                min={checkIn ? dayAfter(checkIn) : todayAsInputValue()}
                value={checkOut}
                onChange={(event) => setCheckOut(event.target.value)}
                required
              />
            </div>
            <div className="search-field guest-field">
              <label htmlFor="guests">
                <Users size={16} /> Guests
              </label>
              <TextInput
                id="guests"
                type="number"
                min={1}
                max={12}
                value={guests}
                onChange={(event) => setGuests(event.currentTarget.value)}
                required
              />
            </div>
            <Button type="submit" className="search-submit" leftSection={<Search size={18} />}>
              Find stays
            </Button>
          </form>
        </Container>
        <div className="hero-note">
          <span>01 / 04</span>
          <span>West coast, India</span>
        </div>
      </section>

      <section className="section-shell destinations-section">
        <Container size="xl">
          <div className="section-heading">
            <div>
              <span className="overline">A GOOD PLACE TO BEGIN</span>
              <h2>India, at your own pace.</h2>
              <p>From unhurried coastlines to cities that never run out of stories.</p>
            </div>
            <Link to="/search" className="text-link">
              All destinations <ArrowRight size={16} />
            </Link>
          </div>

          {destinations.isError ? (
            <QueryError
              message={destinations.error.message}
              onRetry={() => void destinations.refetch()}
            />
          ) : destinations.isPending ? (
            <div className="destination-loading" aria-label="Loading destinations" aria-busy="true">
              {Array.from({ length: 6 }, (_, index) => (
                <div className="destination-loading-card" key={index} />
              ))}
            </div>
          ) : (
            <div className="destination-grid">
              {popularDestinations.map((place, index) => (
                <Link
                  className={`destination-card destination-card-${index + 1}`}
                  key={place.id}
                  to={`/search?${new URLSearchParams({ destination: place.name })}`}
                >
                  <img src={place.imageUrl} alt="" loading="lazy" />
                  <div className="destination-gradient" />
                  <div className="destination-copy">
                    <span>{place.state}</span>
                    <h3>{place.name}</h3>
                    <span>{place.propertyCount} thoughtful stays</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <Group className="synthetic-note" gap="xs">
            <Sparkles size={15} />
            <Text size="sm">
              A little note: every stay and price here is synthetic demo inventory.
            </Text>
          </Group>
        </Container>
      </section>

      <section className="journey-section">
        <Container size="xl" className="journey-inner">
          <div>
            <span className="overline">TAKE THE LONG WAY</span>
            <h2>Make space for the in-between.</h2>
            <p>We’re building one calm place for your stays, plans, and travel days.</p>
          </div>
          <Button component={Link} to="/search" className="journey-button" rightSection={<ArrowRight size={16} />}>
            Find your next stay
          </Button>
        </Container>
      </section>
    </>
  );
}
