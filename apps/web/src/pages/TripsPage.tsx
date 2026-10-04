import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Container, Skeleton, TextInput } from '@mantine/core';
import { CalendarDays, MapPin, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { createTrip, fetchTrips } from '../api';
import { useAuth } from '../auth/AuthProvider';
import { QueryError } from '../ui/QueryError';

export function TripsPage() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const trips = useQuery({
    queryKey: ['trips'],
    queryFn: fetchTrips,
    enabled: Boolean(user),
  });
  const create = useMutation({
    mutationFn: createTrip,
    onSuccess: async () => {
      setName('');
      setDestination('');
      setStartDate('');
      setEndDate('');
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
    onError: (error: Error) => setFormError(error.message),
  });

  if (!authLoading && !user) return <Navigate to="/login" replace />;

  return (
    <Container size="lg" className="feature-page">
      <span className="overline">YOUR TRAVEL PLANS</span>
      <h1 className="feature-title">Trips, taking shape.</h1>
      <p className="feature-subtitle">Bring your plans and the little details together.</p>

      <form
        className="feature-form trip-create-form"
        onSubmit={(event) => {
          event.preventDefault();
          if (!name.trim() || !destination.trim() || !startDate || !endDate) {
            setFormError('Add a trip name, destination, and both dates.');
            return;
          }
          if (endDate <= startDate) {
            setFormError('Your return date must be after your start date.');
            return;
          }
          create.mutate({ name, destination, startDate, endDate });
        }}
      >
        <h2><Plus size={18} /> Start a trip</h2>
        <div className="feature-form-grid">
          <TextInput label="Trip name" placeholder="A long weekend away" value={name} onChange={(event) => setName(event.currentTarget.value)} maxLength={100} required />
          <TextInput label="Destination" placeholder="Goa" value={destination} onChange={(event) => setDestination(event.currentTarget.value)} maxLength={100} required />
          <TextInput label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.currentTarget.value)} required />
          <TextInput label="End date" type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.currentTarget.value)} required />
        </div>
        {formError && <Alert color="red" role="alert">{formError}</Alert>}
        <Button type="submit" className="filter-submit" loading={create.isPending}>Create trip</Button>
      </form>

      <section className="trip-list-section" aria-labelledby="trip-list-heading">
        <div className="feature-section-heading">
          <h2 id="trip-list-heading">Your trips</h2>
          {trips.isSuccess && <span>{trips.data.length} planned</span>}
        </div>
        {authLoading || trips.isPending ? (
          <div className="feature-card-list" aria-busy="true">
            <Skeleton height={120} radius="md" />
            <Skeleton height={120} radius="md" />
          </div>
        ) : trips.isError ? (
          <QueryError message={trips.error.message} onRetry={() => void trips.refetch()} />
        ) : trips.data.length === 0 ? (
          <div className="feature-empty">
            <CalendarDays size={24} />
            <h3>Your first trip starts here.</h3>
            <p>Create a trip above to gather plans in one place.</p>
          </div>
        ) : (
          <div className="trip-card-list">
            {trips.data.map((trip) => (
              <Link className="trip-card" to={`/trips/${trip.id}`} key={trip.id}>
                <span className="trip-card-icon"><MapPin size={20} /></span>
                <span className="trip-card-main">
                  <strong>{trip.name}</strong>
                  <span>{trip.destination}</span>
                </span>
                <span className="trip-card-dates">
                  {new Date(`${trip.start_date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  {' – '}
                  {new Date(`${trip.end_date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="trip-card-events">{trip.event_count ?? 0} plans</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
