import { auth } from './auth/firebase';

export type Destination = {
  id: string;
  name: string;
  state: string;
  countryCode: string;
  timezone: string;
  description: string;
  imageUrl: string;
  propertyCount: number;
  isSynthetic: true;
};

export type RoomType = {
  id: string;
  name: string;
  maxOccupancy: number;
  bedConfiguration: string;
  amenities: string[];
  cancellationPolicy: string;
};

export type Property = {
  id: string;
  name: string;
  description: string;
  propertyType: 'hotel' | 'resort' | 'homestay' | 'guesthouse';
  starRating: number;
  rating: number;
  reviewCount: number;
  address: string;
  city: string;
  state: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  amenities: string[];
  images: { url: string; alt: string }[];
  rooms: RoomType[];
  isSynthetic: true;
};

export type SearchRates = {
  currency: 'INR';
  amountPerNight: number;
  taxesAndFees: number;
  availability: 'available' | 'limited';
  availableRooms: number;
  sampledAt: string;
};

export type PropertySearchResult = {
  property: Omit<Property, 'rooms'>;
  rate: SearchRates;
};

export type Page<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type Trip = {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  created_at: string;
  event_count?: number;
};

export type ItineraryEvent = {
  id: string;
  trip_id: string;
  event_type: 'activity' | 'flight' | 'train' | 'hotel' | 'transfer' | 'other';
  title: string;
  location: string | null;
  description: string | null;
  start_at: string;
  end_at: string;
  created_at: string;
};

export type ItineraryConflict = {
  firstEventId: string;
  secondEventId: string;
  firstTitle: string;
  secondTitle: string;
  reason: 'overlapping_events';
};

export type TripDetail = Trip & {
  events: ItineraryEvent[];
  conflicts: ItineraryConflict[];
};

export type Booking = {
  id: string;
  property_id: string;
  property_name: string;
  room_id: string;
  room_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  currency: 'INR';
  amount_per_night: number;
  taxes_and_fees: number;
  total_amount: number;
  status: 'confirmed';
  payment_method: 'demo_card' | 'demo_upi' | null;
  payment_status: 'demo_succeeded' | null;
  payment_reference: string | null;
  created_at: string;
  isSynthetic: true;
};

export type AdminBooking = Omit<Booking, 'isSynthetic'>;

export type JourneyStats = {
  totalUsers: number;
  propertyViews: number;
  bookingStarts: number;
  confirmedBookings: number;
  funnel: {
    propertyViewedUsers: number;
    bookingStartedUsers: number;
    bookingConfirmedUsers: number;
  };
};

type ApiError = {
  code: string;
  message: string;
  requestId: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(
      error?.requestId
        ? `${error.message} (request ${error.requestId})`
        : `The travel service returned ${response.status}. Please try again.`,
    );
  }
  return (await response.json()) as T;
}

async function authenticatedRequest<T>(
  path: string,
  method: 'GET' | 'POST' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to use this feature.');
  const idToken = await user.getIdToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${idToken}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null;
    throw new Error(
      error?.requestId
        ? `${error.message} (request ${error.requestId})`
        : `The travel service returned ${response.status}. Please try again.`,
    );
  }
  return (await response.json()) as T;
}

export function fetchTrips(): Promise<Trip[]> {
  return authenticatedRequest('/trips', 'GET');
}

export function createTrip(input: {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
}): Promise<Trip> {
  return authenticatedRequest('/trips', 'POST', input);
}

export function fetchTrip(tripId: string): Promise<TripDetail> {
  return authenticatedRequest(`/trips/${encodeURIComponent(tripId)}`, 'GET');
}

export function addItineraryEvent(
  input: {
    tripId: string;
    event: {
      eventType: ItineraryEvent['event_type'];
      title: string;
      location?: string;
      description?: string;
      startAt: string;
      endAt: string;
    };
  },
): Promise<{ event: ItineraryEvent; conflicts: ItineraryConflict[] }> {
  return authenticatedRequest(
    `/trips/${encodeURIComponent(input.tripId)}/events`,
    'POST',
    input.event,
  );
}

export function fetchFavoriteIds(): Promise<string[]> {
  return authenticatedRequest('/favorites', 'GET');
}

export function saveFavorite(propertyId: string): Promise<{ propertyId: string; saved: true }> {
  return authenticatedRequest('/favorites', 'POST', { propertyId });
}

export function removeFavorite(
  propertyId: string,
): Promise<{ propertyId: string; saved: false }> {
  return authenticatedRequest(`/favorites/${encodeURIComponent(propertyId)}`, 'DELETE');
}

export function createBooking(input: {
  propertyId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  paymentMethod: 'demo_card' | 'demo_upi';
}): Promise<Booking> {
  return authenticatedRequest('/bookings', 'POST', input);
}

export function fetchBooking(bookingId: string): Promise<Booking> {
  return authenticatedRequest(`/bookings/${encodeURIComponent(bookingId)}`, 'GET');
}

export function recordJourneyEvent(input: {
  eventId: string;
  eventType: 'property_viewed' | 'booking_started';
  propertyId: string;
}): Promise<{ recorded: true }> {
  return authenticatedRequest('/journey/events', 'POST', input);
}

export function fetchJourneyStats(): Promise<JourneyStats> {
  return authenticatedRequest('/admin/journey', 'GET');
}

export function fetchAdminBookings(): Promise<AdminBooking[]> {
  return authenticatedRequest('/admin/bookings', 'GET');
}

export function fetchDestinations(): Promise<Destination[]> {
  return request('/destinations');
}

export function fetchProperties(params: URLSearchParams): Promise<Page<PropertySearchResult>> {
  const query = new URLSearchParams(params);
  if (!query.has('page')) query.set('page', '1');
  if (!query.has('pageSize')) query.set('pageSize', '12');
  return request(`/properties?${query.toString()}`);
}

export function fetchProperty(propertyId: string): Promise<Property> {
  return request(`/properties/${encodeURIComponent(propertyId)}`);
}

export function fetchAvailability(
  propertyId: string,
  guests: number,
  checkIn?: string,
  checkOut?: string,
): Promise<SearchRates> {
  const params = new URLSearchParams({ guests: String(guests) });
  if (checkIn) params.set('checkIn', checkIn);
  if (checkOut) params.set('checkOut', checkOut);
  return request(`/properties/${encodeURIComponent(propertyId)}/availability?${params}`);
}
