import { useQuery } from '@tanstack/react-query';
import { Alert, Button, Container, Skeleton } from '@mantine/core';
import { CalendarCheck, Eye, RefreshCw, UserRound } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { fetchAdminBookings, fetchJourneyStats } from '../api';
import { useAuth } from '../auth/AuthProvider';
import { QueryError } from '../ui/QueryError';

function formatBookingDate(date: string): string {
  return new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString();
}

export function JourneyDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const stats = useQuery({
    queryKey: ['admin', 'journey'],
    queryFn: fetchJourneyStats,
    enabled: Boolean(user?.isAdmin),
  });
  const bookings = useQuery({
    queryKey: ['admin', 'bookings'],
    queryFn: fetchAdminBookings,
    enabled: Boolean(user?.isAdmin),
  });

  if (authLoading) {
    return (
      <Container size="lg" className="feature-page" aria-busy="true">
        <Skeleton height={42} width="45%" />
        <Skeleton height={160} mt="lg" radius="lg" />
      </Container>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/profile" replace />;

  if (stats.isPending) {
    return (
      <Container size="lg" className="feature-page" aria-busy="true">
        <Skeleton height={42} width="45%" />
        <div className="journey-stat-grid">
          <Skeleton height={135} radius="lg" />
          <Skeleton height={135} radius="lg" />
          <Skeleton height={135} radius="lg" />
        </div>
      </Container>
    );
  }
  if (stats.isError) {
    return (
      <Container size="lg" className="feature-page">
        <QueryError message={stats.error.message} onRetry={() => void stats.refetch()} />
      </Container>
    );
  }

  const data = stats.data;
  const funnel = [
    { label: 'Viewed a property', users: data.funnel.propertyViewedUsers },
    { label: 'Started a booking', users: data.funnel.bookingStartedUsers },
    { label: 'Confirmed a booking', users: data.funnel.bookingConfirmedUsers },
  ];

  return (
    <Container size="lg" className="feature-page journey-dashboard">
      <span className="overline">ADMIN · ALL TIME</span>
      <h1 className="feature-title">The journey so far.</h1>
      <p className="feature-subtitle">Aggregate activity across Safar. No individual user activity is shown.</p>

      <div className="journey-stat-grid" aria-label="Journey summary">
        <article className="journey-stat-card">
          <span className="journey-stat-icon"><UserRound size={19} /></span>
          <span className="journey-stat-label">Registered users</span>
          <strong>{data.totalUsers.toLocaleString()}</strong>
        </article>
        <article className="journey-stat-card">
          <span className="journey-stat-icon"><Eye size={19} /></span>
          <span className="journey-stat-label">Property views</span>
          <strong>{data.propertyViews.toLocaleString()}</strong>
        </article>
        <article className="journey-stat-card">
          <span className="journey-stat-icon"><CalendarCheck size={19} /></span>
          <span className="journey-stat-label">Confirmed demo bookings</span>
          <strong>{data.confirmedBookings.toLocaleString()}</strong>
        </article>
      </div>

      <section className="journey-funnel" aria-labelledby="journey-funnel-heading">
        <div className="feature-section-heading">
          <div>
            <span className="overline">SIGNED-IN USERS</span>
            <h2 id="journey-funnel-heading">Booking funnel</h2>
          </div>
          <Button
            variant="subtle"
            leftSection={<RefreshCw size={15} />}
            onClick={() => {
              void stats.refetch();
              void bookings.refetch();
            }}
          >
            Refresh
          </Button>
        </div>
        <p className="journey-funnel-note">
          Funnel counts are distinct users. Property views and booking starts are event totals above.
        </p>
        <div className="journey-funnel-list">
          {funnel.map((step, index) => {
            const previous = index === 0 ? data.totalUsers : funnel[index - 1]!.users;
            const conversion = previous > 0 ? Math.min(100, Math.round(step.users / previous * 100)) : 0;
            return (
              <article className="journey-funnel-step" key={step.label}>
                <div className="journey-funnel-copy">
                  <span>{index + 1}</span>
                  <strong>{step.label}</strong>
                </div>
                <div className="journey-funnel-value">
                  <strong>{step.users.toLocaleString()}</strong>
                  <span>{conversion}% of previous step</span>
                </div>
                <div className="journey-funnel-track" aria-hidden="true">
                  <span style={{ width: `${data.totalUsers > 0 ? Math.min(100, step.users / data.totalUsers * 100) : 0}%` }} />
                </div>
              </article>
            );
          })}
        </div>
        <div className="journey-funnel-footnote">
          <span>{data.bookingStarts.toLocaleString()} booking starts recorded</span>
          <span>{data.confirmedBookings.toLocaleString()} confirmed booking records</span>
        </div>
      </section>
      <section className="journey-funnel admin-bookings" aria-labelledby="admin-bookings-heading">
        <div className="feature-section-heading">
          <div>
            <span className="overline">LATEST 100 · NO CUSTOMER IDENTIFIERS</span>
            <h2 id="admin-bookings-heading">Demo bookings</h2>
          </div>
          <span>{bookings.data?.length ?? 0} shown</span>
        </div>
        {bookings.isPending ? (
          <Skeleton height={150} radius="lg" />
        ) : bookings.isError ? (
          <QueryError message={bookings.error.message} onRetry={() => void bookings.refetch()} />
        ) : bookings.data.length === 0 ? (
          <p className="journey-funnel-note">No demo bookings yet. Complete a demo checkout to see it here.</p>
        ) : (
          <div className="admin-bookings-table-wrap">
            <table className="admin-bookings-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Stay</th>
                  <th>Dates</th>
                  <th>Guests</th>
                  <th>Total</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {bookings.data.map((booking) => (
                  <tr key={booking.id}>
                    <td><strong>{booking.id.slice(0, 8).toUpperCase()}</strong><span>{new Date(booking.created_at).toLocaleDateString()}</span></td>
                    <td><strong>{booking.property_name}</strong><span>{booking.room_name}</span></td>
                    <td>{formatBookingDate(booking.check_in)} – {formatBookingDate(booking.check_out)}</td>
                    <td>{booking.guests}</td>
                    <td>₹{booking.total_amount.toLocaleString('en-IN')}</td>
                    <td>{booking.payment_method ? `${booking.payment_method === 'demo_upi' ? 'Demo UPI' : 'Demo card'} · simulated` : 'Not recorded'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <Alert color="teal" variant="light" mt="lg">
        Reservations, prices, and payment outcomes are synthetic demo data, not real sales. Analytics are aggregate counts; the bookings list intentionally omits customer names and email addresses.
      </Alert>
    </Container>
  );
}
