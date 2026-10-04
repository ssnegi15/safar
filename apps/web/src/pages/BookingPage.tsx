import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, Button, Container, Select, Skeleton, TextInput } from '@mantine/core';
import { ArrowLeft, CalendarDays, CheckCircle2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createBooking, fetchAvailability, fetchBooking, fetchProperty, recordJourneyEvent } from '../api';
import { useAuth } from '../auth/AuthProvider';
import { QueryError } from '../ui/QueryError';

const rupees = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const dayMs = 86_400_000;
const isoDate = (date: Date) => date.toISOString().slice(0, 10);

function formatDate(date: string): string {
  const dateOnly = date.slice(0, 10);
  return new Date(`${dateOnly}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function BookingPage() {
  const { id: propertyId, bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [checkIn, setCheckIn] = useState(
    searchParams.get('checkIn') ?? isoDate(new Date(Date.now() + dayMs)),
  );
  const [checkOut, setCheckOut] = useState(
    searchParams.get('checkOut') ?? isoDate(new Date(Date.now() + 3 * dayMs)),
  );
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 2);
  const [roomId, setRoomId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'demo_card' | 'demo_upi'>('demo_card');
  const [formError, setFormError] = useState<string | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const property = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => fetchProperty(propertyId!),
    enabled: Boolean(propertyId && !bookingId),
  });
  const booking = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => fetchBooking(bookingId!),
    enabled: Boolean(bookingId && user),
  });
  const availability = useQuery({
    queryKey: ['availability', propertyId, guests, checkIn, checkOut],
    queryFn: () => fetchAvailability(propertyId!, guests, checkIn, checkOut),
    enabled: Boolean(
      propertyId && property.data && checkIn && checkOut && checkOut > checkIn,
    ),
  });
  const suitableRooms = useMemo(
    () => property.data?.rooms.filter((room) => room.maxOccupancy >= guests) ?? [],
    [guests, property.data],
  );
  const selectedRoom =
    suitableRooms.find((room) => room.id === roomId) ?? suitableRooms[0];

  const create = useMutation({
    mutationFn: createBooking,
    onSuccess: async (createdBooking) => {
      await navigate(`/bookings/${createdBooking.id}`, { replace: true });
    },
    onError: (error: Error) => setFormError(error.message),
  });

  if (authLoading) {
    return (
      <Container size="md" className="feature-page" aria-busy="true">
        <Skeleton height={42} width="55%" />
        <Skeleton height={300} mt="lg" radius="lg" />
      </Container>
    );
  }
  if (!user) {
    const returnTo = bookingId ? `/bookings/${bookingId}` : `/hotels/${propertyId}/book`;
    return (
      <Container size="sm" className="auth-page">
        <section className="auth-card">
          <span className="overline">A MOMENT BEFORE YOU BOOK</span>
          <h1>Sign in to save your stay.</h1>
          <p>Your demo booking will be saved in your personal trip space.</p>
          <Button
            component={Link}
            to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
            className="filter-submit"
          >
            Sign in to continue
          </Button>
        </section>
      </Container>
    );
  }

  if (bookingId) {
    if (booking.isPending) {
      return (
        <Container size="md" className="feature-page" aria-busy="true">
          <Skeleton height={42} width="55%" />
          <Skeleton height={260} mt="lg" radius="lg" />
        </Container>
      );
    }
    if (booking.isError) {
      return (
        <Container size="md" className="feature-page">
          <QueryError message={booking.error.message} onRetry={() => void booking.refetch()} />
        </Container>
      );
    }

    const stay = booking.data;
    return (
      <Container size="md" className="feature-page">
        <section className="booking-confirmation">
          <span className="booking-confirmation-icon"><CheckCircle2 size={28} /></span>
          <span className="overline">DEMO BOOKING CONFIRMED</span>
          <h1 className="feature-title">Your stay is saved.</h1>
          <p className="feature-subtitle">{stay.property_name} · {stay.room_name}</p>
          <div className="booking-confirmation-details">
            <div><span>Dates</span><strong>{formatDate(stay.check_in)} – {formatDate(stay.check_out)}</strong></div>
            <div><span>Guests</span><strong>{stay.guests}</strong></div>
            <div><span>Rate per night</span><strong>₹{rupees.format(stay.amount_per_night)}</strong></div>
            <div><span>Taxes and fees</span><strong>₹{rupees.format(stay.taxes_and_fees)}</strong></div>
            <div className="booking-total"><span>Total · {stay.currency}</span><strong>₹{rupees.format(stay.total_amount)}</strong></div>
            <div><span>Payment</span><strong>{stay.payment_method ? `${stay.payment_method === 'demo_upi' ? 'Demo UPI' : 'Demo card'} · simulated` : 'Not recorded'}</strong></div>
            <div><span>Payment reference</span><strong>{stay.payment_reference ?? 'Not recorded'}</strong></div>
            <div><span>Confirmation</span><strong>{stay.id.slice(0, 8).toUpperCase()}</strong></div>
          </div>
          <Alert color="teal" variant="light" mt="lg">
            This is a synthetic demo reservation. Payment was simulated only; no payment details were collected and no real hotel was contacted.
          </Alert>
          <Button component={Link} to="/search" variant="default" mt="lg">
            Explore more stays
          </Button>
        </section>
      </Container>
    );
  }

  if (property.isPending) {
    return (
      <Container size="md" className="feature-page" aria-busy="true">
        <Skeleton height={42} width="55%" />
        <Skeleton height={300} mt="lg" radius="lg" />
      </Container>
    );
  }
  if (property.isError) {
    return (
      <Container size="md" className="feature-page">
        <QueryError message={property.error.message} onRetry={() => void property.refetch()} />
      </Container>
    );
  }
  if (!propertyId) return <Navigate to="/search" replace />;

  const nights = checkIn && checkOut && checkOut > checkIn
    ? (Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / dayMs
    : 0;
  const rates = availability.data;
  const total = rates ? nights * rates.amountPerNight + rates.taxesAndFees : 0;

  return (
    <Container size="md" className="feature-page">
      <Link to={`/hotels/${propertyId}`} className="back-link">
        <ArrowLeft size={16} /> Back to {property.data.name}
      </Link>
      <span className="overline">PLAN YOUR STAY</span>
      <h1 className="feature-title">Make it yours.</h1>
      <p className="feature-subtitle">{property.data.name} · {property.data.city}, {property.data.state}</p>

      <form
        className="feature-form booking-form"
        onSubmit={(event) => {
          event.preventDefault();
          setFormError(null);
          if (!checkIn || !checkOut || checkOut <= checkIn) {
            setFormError('Choose a check-out date after check-in.');
            return;
          }
          if (!selectedRoom) {
            setFormError('Choose a room that can accommodate your party.');
            return;
          }
          if (!rates || rates.availableRooms < 1) {
            setFormError('No rooms are available for those dates.');
            return;
          }
          void recordJourneyEvent({
            eventId: crypto.randomUUID(),
            eventType: 'booking_started',
            propertyId,
          }).catch((error: Error) => setTrackingError(error.message));
          create.mutate({
            propertyId,
            roomId: selectedRoom.id,
            checkIn,
            checkOut,
            guests,
            paymentMethod,
          });
        }}
      >
        <h2><CalendarDays size={18} /> Your stay details</h2>
        <div className="booking-fields">
          <TextInput
            label="Check-in"
            type="date"
            min={isoDate(new Date())}
            value={checkIn}
            onChange={(event) => setCheckIn(event.currentTarget.value)}
            required
          />
          <TextInput
            label="Check-out"
            type="date"
            min={checkIn || isoDate(new Date())}
            value={checkOut}
            onChange={(event) => setCheckOut(event.currentTarget.value)}
            required
          />
          <Select
            label="Guests"
            value={String(guests)}
            onChange={(value) => setGuests(Number(value ?? 1))}
            data={Array.from({ length: 12 }, (_, index) => ({
              value: String(index + 1),
              label: `${index + 1} ${index === 0 ? 'guest' : 'guests'}`,
            }))}
            allowDeselect={false}
          />
          <Select
            label="Room"
            placeholder="Choose a room"
            value={selectedRoom?.id ?? null}
            onChange={(value) => setRoomId(value ?? '')}
            data={suitableRooms.map((room) => ({
              value: room.id,
              label: room.name,
            }))}
            disabled={suitableRooms.length === 0}
          />
        </div>
        <Select
          label="Demo payment method"
          description="Simulation only. No card or bank details are requested."
          value={paymentMethod}
          onChange={(value) => {
            if (value === 'demo_card' || value === 'demo_upi') setPaymentMethod(value);
          }}
          data={[
            { value: 'demo_card', label: 'Demo card' },
            { value: 'demo_upi', label: 'Demo UPI' },
          ]}
          allowDeselect={false}
        />
        {suitableRooms.length === 0 && (
          <Alert color="yellow" role="status">
            None of the listed rooms can accommodate {guests} guests. Try a smaller party.
          </Alert>
        )}
        {formError && <Alert color="red" role="alert">{formError}</Alert>}
        {trackingError && (
          <Alert color="yellow" role="status">
            Journey metrics could not be updated: {trackingError}
          </Alert>
        )}
        {availability.isError && (
          <Alert color="red" role="alert">{availability.error.message}</Alert>
        )}
        <div className="booking-price-summary">
          {availability.isPending ? (
            <Skeleton height={52} />
          ) : rates ? (
            <>
              <div><span>{nights} {nights === 1 ? 'night' : 'nights'} · ₹{rupees.format(rates.amountPerNight)} / night</span><strong>₹{rupees.format(nights * rates.amountPerNight)}</strong></div>
              <div><span>Taxes and fees</span><strong>₹{rupees.format(rates.taxesAndFees)}</strong></div>
              <div className="booking-total"><span>Demo total</span><strong>₹{rupees.format(total)}</strong></div>
              <small>{rates.availableRooms} synthetic rooms currently shown as available. Checkout records a simulated success only.</small>
            </>
          ) : (
            <span>Choose valid dates to see the current demo rate.</span>
          )}
        </div>
        <Button
          type="submit"
          className="filter-submit"
          loading={create.isPending}
          disabled={!rates || rates.availableRooms < 1 || !selectedRoom || availability.isError}
        >
          Pay ₹{rupees.format(total)} · demo only
        </Button>
      </form>
    </Container>
  );
}
