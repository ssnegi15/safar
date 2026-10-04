import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Container, Select, Skeleton, TextInput, Textarea } from '@mantine/core';
import { AlertTriangle, CalendarDays, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { addItineraryEvent, fetchTrip } from '../api';
import type { ItineraryEvent } from '../api';
import { useAuth } from '../auth/AuthProvider';
import { QueryError } from '../ui/QueryError';

const EVENT_TYPES = [
  { value: 'activity', label: 'Activity' },
  { value: 'flight', label: 'Flight' },
  { value: 'train', label: 'Train' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'other', label: 'Other' },
];

function isEventType(value: string): value is ItineraryEvent['event_type'] {
  return EVENT_TYPES.some((option) => option.value === value);
}

function localDateTimeToIso(value: string): string {
  return new Date(value).toISOString();
}

function formatEventDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function TripDetailPage() {
  const { tripId = '' } = useParams();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [eventType, setEventType] = useState<string | null>('activity');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const trip = useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => fetchTrip(tripId),
    enabled: Boolean(user && tripId),
  });
  const addEvent = useMutation({
    mutationFn: (input: Parameters<typeof addItineraryEvent>[0]) => addItineraryEvent(input),
    onSuccess: async () => {
      setTitle('');
      setLocation('');
      setDescription('');
      setStartAt('');
      setEndAt('');
      setFormError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trip', tripId] }),
        queryClient.invalidateQueries({ queryKey: ['trips'] }),
      ]);
    },
    onError: (error: Error) => setFormError(error.message),
  });

  if (!authLoading && !user) return <Navigate to="/login" replace />;

  return (
    <Container size="lg" className="feature-page">
      <Link to="/trips" className="back-link">← All trips</Link>
      {authLoading || trip.isPending ? (
        <div className="feature-card-list" aria-busy="true">
          <Skeleton height={50} width="50%" />
          <Skeleton height={180} radius="md" />
        </div>
      ) : trip.isError ? (
        <QueryError message={trip.error.message} onRetry={() => void trip.refetch()} />
      ) : (
        <>
          <span className="overline">YOUR ITINERARY</span>
          <h1 className="feature-title">{trip.data.name}</h1>
          <p className="feature-subtitle">
            <MapPin size={15} /> {trip.data.destination}
            <span> · </span>
            {new Date(`${trip.data.start_date}T00:00:00`).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            {' – '}
            {new Date(`${trip.data.end_date}T00:00:00`).toLocaleDateString(undefined, { dateStyle: 'medium' })}
          </p>

          {trip.data.conflicts.length > 0 && (
            <Alert color="orange" icon={<AlertTriangle size={17} />} title="A few plans overlap" className="conflict-alert">
              {trip.data.conflicts.map((conflict) => (
                <div key={`${conflict.firstEventId}-${conflict.secondEventId}`}>
                  {conflict.firstTitle} overlaps with {conflict.secondTitle}.
                </div>
              ))}
            </Alert>
          )}

          <form
            className="feature-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!eventType || !isEventType(eventType) || !title.trim() || !startAt || !endAt) {
                setFormError('Add an event type, title, and start/end times.');
                return;
              }
              if (new Date(endAt) <= new Date(startAt)) {
                setFormError('The event end time must be after its start time.');
                return;
              }
              addEvent.mutate({
                tripId,
                event: {
                  eventType,
                  title,
                  ...(location.trim() ? { location } : {}),
                  ...(description.trim() ? { description } : {}),
                  startAt: localDateTimeToIso(startAt),
                  endAt: localDateTimeToIso(endAt),
                },
              });
            }}
          >
            <h2><CalendarDays size={18} /> Add to your itinerary</h2>
            <div className="feature-form-grid">
              <Select label="Plan type" data={EVENT_TYPES} value={eventType} onChange={setEventType} allowDeselect={false} />
              <TextInput label="Title" placeholder="Sunset boat ride" value={title} onChange={(event) => setTitle(event.currentTarget.value)} maxLength={120} required />
              <TextInput label="Location" placeholder="Old Goa" value={location} onChange={(event) => setLocation(event.currentTarget.value)} maxLength={160} />
              <TextInput label="Starts" type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.currentTarget.value)} required />
              <TextInput label="Ends" type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.currentTarget.value)} required />
            </div>
            <Textarea label="Notes" placeholder="Anything to remember?" value={description} onChange={(event) => setDescription(event.currentTarget.value)} maxLength={1000} />
            {formError && <Alert color="red" role="alert">{formError}</Alert>}
            <Button type="submit" className="filter-submit" loading={addEvent.isPending}>Add plan</Button>
          </form>

          <section className="trip-list-section">
            <div className="feature-section-heading">
              <h2>Itinerary</h2>
              <span>{trip.data.events.length} plans</span>
            </div>
            {trip.data.events.length === 0 ? (
              <div className="feature-empty">
                <CalendarDays size={24} />
                <h3>Your itinerary is ready to fill.</h3>
                <p>Add activities, transport, or stays using the form above.</p>
              </div>
            ) : (
              <div className="itinerary-list">
                {trip.data.events.map((item) => {
                  const hasConflict = trip.data.conflicts.some(
                    (conflict) => conflict.firstEventId === item.id || conflict.secondEventId === item.id,
                  );
                  return (
                    <article className={hasConflict ? 'itinerary-item has-conflict' : 'itinerary-item'} key={item.id}>
                      <div className="itinerary-time">{formatEventDate(item.start_at)}</div>
                      <div className="itinerary-marker" />
                      <div className="itinerary-content">
                        <span className="itinerary-kind">{item.event_type}</span>
                        <h3>{item.title}</h3>
                        {item.location && <p className="itinerary-location"><MapPin size={13} /> {item.location}</p>}
                        {item.description && <p>{item.description}</p>}
                        <span className="itinerary-duration">Until {formatEventDate(item.end_at)}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </Container>
  );
}
