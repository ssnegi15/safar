import { Route, Routes } from 'react-router-dom';
import { AppShell } from '../ui/AppShell';
import { HomePage } from './HomePage';
import { SearchPage } from './SearchPage';
import { PropertyPage } from './PropertyPage';
import { NotFoundPage } from './NotFoundPage';
import { LoginPage } from './LoginPage';
import { ProfilePage } from './ProfilePage';
import { TripsPage } from './TripsPage';
import { TripDetailPage } from './TripDetailPage';
import { FavoritesPage } from './FavoritesPage';
import { BookingPage } from './BookingPage';
import { JourneyDashboardPage } from './JourneyDashboardPage';

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/hotels/:id" element={<PropertyPage />} />
        <Route path="/hotels/:id/book" element={<BookingPage />} />
        <Route path="/bookings/:bookingId" element={<BookingPage />} />
        <Route path="/admin/journey" element={<JourneyDashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/trips/:tripId" element={<TripDetailPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
