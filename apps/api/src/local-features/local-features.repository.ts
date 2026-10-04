import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import type { AppConfig } from '../config';
import { DemoPaymentAdapter } from './demo-payment.adapter';

export type TripRecord = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string;
  end_date: string;
  created_at: Date;
  event_count?: number;
};

export type ItineraryEventRecord = {
  id: string;
  trip_id: string;
  event_type: string;
  title: string;
  location: string | null;
  description: string | null;
  start_at: Date;
  end_at: Date;
  created_at: Date;
};

export type ItineraryConflict = {
  firstEventId: string;
  secondEventId: string;
  firstTitle: string;
  secondTitle: string;
  reason: 'overlapping_events';
};

export type BookingRecord = {
  id: string;
  property_id: string;
  property_name: string;
  room_id: string;
  room_name: string;
  check_in: string;
  check_out: string;
  guests: number;
  currency: string;
  amount_per_night: number;
  taxes_and_fees: number;
  total_amount: number;
  status: 'confirmed';
  payment_method: 'demo_card' | 'demo_upi' | null;
  payment_status: 'demo_succeeded' | null;
  payment_reference: string | null;
  created_at: Date;
};

export type AdminBookingRecord = BookingRecord;

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

type JourneyStatsRow = {
  totalUsers: number;
  propertyViews: number;
  bookingStarts: number;
  confirmedBookings: number;
  propertyViewedUsers: number;
  bookingStartedUsers: number;
  bookingConfirmedUsers: number;
};

@Injectable()
export class LocalFeaturesRepository implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(LocalFeaturesRepository.name);
  private readonly pool: Pool;
  private readonly demoPaymentAdapter = new DemoPaymentAdapter();

  constructor(config: AppConfig['database']) {
    this.pool = new Pool({ connectionString: config.url });
  }

  async onModuleInit(): Promise<void> {
    await this.pool.query('SELECT 1');
    this.logger.log('Local feature repository connected');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }

  async listTrips(tenantId: string): Promise<TripRecord[]> {
    const result = await this.pool.query<TripRecord>(
      `SELECT t.id, t.name, t.destination, t.start_date, t.end_date, t.created_at,
              COUNT(e.id)::int AS event_count
       FROM trips t
       LEFT JOIN itinerary_events e
         ON e.trip_id = t.id AND e.tenant_id = t.tenant_id
       WHERE t.tenant_id = $1
       GROUP BY t.id
       ORDER BY t.start_date, t.created_at DESC`,
      [tenantId],
    );
    return result.rows;
  }

  async createTrip(
    tenantId: string,
    trip: { name: string; destination: string; startDate: string; endDate: string },
  ): Promise<TripRecord> {
    const result = await this.pool.query<TripRecord>(
      `INSERT INTO trips (id, tenant_id, name, destination, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, destination, start_date, end_date, created_at`,
      [
        randomUUID(),
        tenantId,
        trip.name.trim(),
        trip.destination.trim(),
        trip.startDate,
        trip.endDate,
      ],
    );
    return result.rows[0]!;
  }

  async getTrip(tenantId: string, tripId: string): Promise<TripRecord> {
    const result = await this.pool.query<TripRecord>(
      `SELECT t.id, t.name, t.destination, t.start_date, t.end_date, t.created_at,
              COUNT(e.id)::int AS event_count
       FROM trips t
       LEFT JOIN itinerary_events e
         ON e.trip_id = t.id AND e.tenant_id = t.tenant_id
       WHERE t.tenant_id = $1 AND t.id = $2
       GROUP BY t.id`,
      [tenantId, tripId],
    );
    const trip = result.rows[0];
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async listEvents(tenantId: string, tripId: string): Promise<ItineraryEventRecord[]> {
    await this.getTrip(tenantId, tripId);
    const result = await this.pool.query<ItineraryEventRecord>(
      `SELECT id, trip_id, event_type, title, location, description, start_at, end_at, created_at
       FROM itinerary_events
       WHERE tenant_id = $1 AND trip_id = $2
       ORDER BY start_at, created_at`,
      [tenantId, tripId],
    );
    return result.rows;
  }

  async createEvent(
    tenantId: string,
    tripId: string,
    event: {
      eventType: string;
      title: string;
      location?: string;
      description?: string;
      startAt: string;
      endAt: string;
    },
  ): Promise<{ event: ItineraryEventRecord; conflicts: ItineraryConflict[] }> {
    await this.getTrip(tenantId, tripId);
    const existing = await this.listEvents(tenantId, tripId);
    const startAt = Date.parse(event.startAt);
    const endAt = Date.parse(event.endAt);
    if (endAt <= startAt) {
      throw new BadRequestException('Event end time must be after its start time');
    }
    const conflicts = existing
      .filter((candidate) => {
        const candidateStart = new Date(candidate.start_at).getTime();
        const candidateEnd = new Date(candidate.end_at).getTime();
        return startAt < candidateEnd && candidateStart < endAt;
      })
      .map((candidate) => ({
        firstEventId: candidate.id,
        secondEventId: '',
        firstTitle: candidate.title,
        secondTitle: event.title,
        reason: 'overlapping_events' as const,
      }));
    const result = await this.pool.query<ItineraryEventRecord>(
      `INSERT INTO itinerary_events
         (id, tenant_id, trip_id, event_type, title, location, description, start_at, end_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, trip_id, event_type, title, location, description, start_at, end_at, created_at`,
      [
        randomUUID(),
        tenantId,
        tripId,
        event.eventType,
        event.title.trim(),
        event.location?.trim() || null,
        event.description?.trim() || null,
        event.startAt,
        event.endAt,
      ],
    );
    const createdEvent = result.rows[0]!;
    return {
      event: createdEvent,
      conflicts: conflicts.map((conflict) => ({
        ...conflict,
        secondEventId: createdEvent.id,
      })),
    };
  }

  async listFavoritePropertyIds(tenantId: string): Promise<string[]> {
    const result = await this.pool.query<{ property_id: string }>(
      'SELECT property_id FROM favorites WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId],
    );
    return result.rows.map((row) => row.property_id);
  }

  async saveFavorite(tenantId: string, propertyId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO favorites (tenant_id, property_id)
       VALUES ($1, $2)
       ON CONFLICT (tenant_id, property_id) DO NOTHING`,
      [tenantId, propertyId],
    );
  }

  async removeFavorite(tenantId: string, propertyId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM favorites WHERE tenant_id = $1 AND property_id = $2',
      [tenantId, propertyId],
    );
  }

  async createBooking(
    tenantId: string,
    booking: {
      propertyId: string;
      propertyName: string;
      roomId: string;
      roomName: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      amountPerNight: number;
      taxesAndFees: number;
      totalAmount: number;
      paymentMethod: 'demo_card' | 'demo_upi';
    },
  ): Promise<BookingRecord> {
    const client = await this.pool.connect();
    const bookingId = randomUUID();
    const payment = this.demoPaymentAdapter.simulatePayment({
      method: booking.paymentMethod,
      amount: booking.totalAmount,
      currency: 'INR',
    });

    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO bookings (
         id, tenant_id, property_id, property_name, room_id, room_name,
         check_in, check_out, guests, amount_per_night, taxes_and_fees, total_amount
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          bookingId,
          tenantId,
          booking.propertyId,
          booking.propertyName,
          booking.roomId,
          booking.roomName,
          booking.checkIn,
          booking.checkOut,
          booking.guests,
          booking.amountPerNight,
          booking.taxesAndFees,
          booking.totalAmount,
        ],
      );
      await client.query(
        `INSERT INTO demo_payments (
           id, booking_id, payment_method, status, amount, demo_reference
         )
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [payment.id, bookingId, payment.method, payment.status, payment.amount, payment.reference],
      );
      const result = await client.query<BookingRecord>(
        `SELECT b.id, b.property_id, b.property_name, b.room_id, b.room_name,
                b.check_in, b.check_out, b.guests, b.currency, b.amount_per_night,
                b.taxes_and_fees, b.total_amount, b.status, b.created_at,
                p.payment_method, p.status AS payment_status, p.demo_reference AS payment_reference
         FROM bookings b
         JOIN demo_payments p ON p.booking_id = b.id
         WHERE b.id = $1`,
        [bookingId],
      );
      await client.query('COMMIT');
      return result.rows[0]!;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getBooking(tenantId: string, bookingId: string): Promise<BookingRecord> {
    const result = await this.pool.query<BookingRecord>(
      `SELECT bookings.id, bookings.property_id, bookings.property_name,
              bookings.room_id, bookings.room_name, bookings.check_in, bookings.check_out,
              bookings.guests, bookings.currency, bookings.amount_per_night,
              bookings.taxes_and_fees, bookings.total_amount,
              bookings.status AS status,
              bookings.created_at, payment_method, demo_payments.status AS payment_status,
              demo_payments.demo_reference AS payment_reference
       FROM bookings
       LEFT JOIN demo_payments ON demo_payments.booking_id = bookings.id
       WHERE tenant_id = $1 AND bookings.id = $2`,
      [tenantId, bookingId],
    );
    const booking = result.rows[0];
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async listAdminBookings(): Promise<AdminBookingRecord[]> {
    const result = await this.pool.query<AdminBookingRecord>(
      `SELECT b.id, b.property_id, b.property_name, b.room_id, b.room_name,
              b.check_in, b.check_out, b.guests, b.currency, b.amount_per_night,
              b.taxes_and_fees, b.total_amount, b.status, b.created_at,
              p.payment_method, p.status AS payment_status, p.demo_reference AS payment_reference
       FROM bookings b
       LEFT JOIN demo_payments p ON p.booking_id = b.id
       ORDER BY b.created_at DESC
       LIMIT 100`,
    );
    return result.rows;
  }

  async recordJourneyEvent(
    tenantId: string,
    event: { eventId: string; eventType: 'property_viewed' | 'booking_started'; propertyId: string },
  ): Promise<void> {
    await this.pool.query(
      `INSERT INTO user_journey_events (id, tenant_id, event_type, property_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO NOTHING`,
      [event.eventId, tenantId, event.eventType, event.propertyId],
    );
  }

  async getJourneyStats(): Promise<JourneyStats> {
    const result = await this.pool.query<JourneyStatsRow>(
      `SELECT
         (SELECT COUNT(*)::int FROM users) AS "totalUsers",
         (SELECT COUNT(*)::int FROM user_journey_events WHERE event_type = 'property_viewed')
           AS "propertyViews",
         (SELECT COUNT(*)::int FROM user_journey_events WHERE event_type = 'booking_started')
           AS "bookingStarts",
         (SELECT COUNT(*)::int FROM bookings) AS "confirmedBookings",
         (SELECT COUNT(DISTINCT tenant_id)::int FROM user_journey_events
           WHERE event_type = 'property_viewed') AS "propertyViewedUsers",
         (SELECT COUNT(DISTINCT tenant_id)::int FROM user_journey_events
           WHERE event_type = 'booking_started') AS "bookingStartedUsers",
         (SELECT COUNT(DISTINCT tenant_id)::int FROM bookings) AS "bookingConfirmedUsers"`,
    );
    return {
      totalUsers: result.rows[0]!.totalUsers,
      propertyViews: result.rows[0]!.propertyViews,
      bookingStarts: result.rows[0]!.bookingStarts,
      confirmedBookings: result.rows[0]!.confirmedBookings,
      funnel: {
        propertyViewedUsers: result.rows[0]!.propertyViewedUsers,
        bookingStartedUsers: result.rows[0]!.bookingStartedUsers,
        bookingConfirmedUsers: result.rows[0]!.bookingConfirmedUsers,
      },
    };
  }
}
