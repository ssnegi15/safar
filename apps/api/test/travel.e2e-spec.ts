import { UnauthorizedException, ValidationPipe } from '@nestjs/common';
import type { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import type { AuthenticatedRequest } from '../src/auth/authenticated-request';
import { BearerAuthGuard } from '../src/auth/bearer-auth.guard';
import { IDENTITY_REPOSITORY } from '../src/auth/auth.tokens';
import type { AuthenticatedPrincipal } from '../src/auth/auth.types';
import { ApiExceptionFilter } from '../src/common/api-exception.filter';
import { RequestContextMiddleware } from '../src/common/request-context.middleware';
import { LocalFeaturesRepository } from '../src/local-features/local-features.repository';

describe('Travel discovery API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(IDENTITY_REPOSITORY)
      .useValue({
        getOrCreatePersonalIdentity: jest.fn(async (principal: AuthenticatedPrincipal) => ({
          id: principal.subject,
          displayName: 'Test Traveler',
          tenant: {
            id: 'personal-server-assigned-tenant',
            name: "Test Traveler's trips",
            type: 'personal',
            role: 'owner',
          },
        })),
      })
      .overrideProvider(LocalFeaturesRepository)
      .useValue({
        createBooking: jest.fn(async (_tenantId: string, input: {
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
        }) => ({
          id: '123e4567-e89b-42d3-a456-426614174000',
          property_id: input.propertyId,
          property_name: input.propertyName,
          room_id: input.roomId,
          room_name: input.roomName,
          check_in: input.checkIn,
          check_out: input.checkOut,
          guests: input.guests,
          currency: 'INR',
          amount_per_night: input.amountPerNight,
          taxes_and_fees: input.taxesAndFees,
          total_amount: input.totalAmount,
          status: 'confirmed',
          payment_method: input.paymentMethod,
          payment_status: 'demo_succeeded',
          payment_reference: 'DEMO-1234ABCD',
          created_at: new Date(),
        })),
        getBooking: jest.fn(),
        recordJourneyEvent: jest.fn(),
        getJourneyStats: jest.fn().mockResolvedValue({
          totalUsers: 3,
          propertyViews: 4,
          bookingStarts: 2,
          confirmedBookings: 1,
          funnel: {
            propertyViewedUsers: 2,
            bookingStartedUsers: 1,
            bookingConfirmedUsers: 1,
          },
        }),
      })
      .overrideGuard(BearerAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
          if (!request.header('authorization')) {
            throw new UnauthorizedException('Bearer access token required');
          }
          request.principal = {
            subject: 'verified-test-user',
            issuer: 'https://issuer.example.test/tenant/v2.0',
          };
          return true;
        },
      })
      .compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.use(new RequestContextMiddleware().use);
    app.useGlobalFilters(new ApiExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lists the deterministic India destination set', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/destinations')
      .expect(200);

    expect(response.body).toHaveLength(14);
    expect(response.body.every((destination: { isSynthetic: boolean }) => destination.isSynthetic))
      .toBe(true);
  });

  it('searches and filters properties with typed URL parameters', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/properties')
      .query({ destination: 'Goa', propertyType: 'resort', guests: 2, pageSize: 5 })
      .expect(200);

    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.items).toHaveLength(response.body.total);
    expect(response.body.items[0].property.city).toBe('Goa');
    expect(response.body.items[0].property.propertyType).toBe('resort');
  });

  it('rejects an invalid date range with the public error shape', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/properties')
      .query({ checkIn: '2026-10-12', checkOut: '2026-10-10' })
      .expect(400);

    expect(response.body).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Check-out must be after check-in',
    });
    expect(response.body.requestId).toBe(response.headers['x-request-id']);
  });

  it('protects the current-user endpoint and ignores client tenant selection', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .query({ tenantId: 'another-users-tenant' })
      .expect(401);

    expect(response.body).toMatchObject({
      code: 'UNAUTHORIZED',
      message: 'Bearer access token required',
    });
  });

  it('returns only the server-resolved personal tenant for an authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('authorization', 'Bearer test-token')
      .query({ tenantId: 'attacker-selected-tenant' })
      .expect(200);

    expect(response.body.tenant).toEqual({
      id: 'personal-server-assigned-tenant',
      name: "Test Traveler's trips",
      type: 'personal',
      role: 'owner',
    });
    expect(response.body.tenant.id).not.toBe('attacker-selected-tenant');
  });

  it('creates a tenant-scoped booking using server-resolved inventory and rates', async () => {
    const propertyResponse = await request(app.getHttpServer())
      .get('/api/v1/properties/stay-goa-1')
      .expect(200);
    const checkIn = new Date(Date.now() + 10 * 86_400_000).toISOString().slice(0, 10);
    const checkOut = new Date(Date.now() + 12 * 86_400_000).toISOString().slice(0, 10);

    const response = await request(app.getHttpServer())
      .post('/api/v1/bookings')
      .set('authorization', '******')
      .send({
        propertyId: propertyResponse.body.id,
        roomId: propertyResponse.body.rooms[0].id,
        checkIn,
        checkOut,
        guests: 2,
        paymentMethod: 'demo_upi',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: '123e4567-e89b-42d3-a456-426614174000',
      property_name: propertyResponse.body.name,
      status: 'confirmed',
      payment_method: 'demo_upi',
      payment_status: 'demo_succeeded',
      payment_reference: 'DEMO-1234ABCD',
      isSynthetic: true,
    });
    expect(response.body.amount_per_night).toBeGreaterThan(0);
    expect(response.body.total_amount).toBeGreaterThan(response.body.amount_per_night);
  });

  it('records a signed-in property view and protects aggregate journey metrics', async () => {
    const eventId = '123e4567-e89b-42d3-a456-426614174001';
    await request(app.getHttpServer())
      .post('/api/v1/journey/events')
      .set('authorization', '******')
      .send({ eventId, eventType: 'property_viewed', propertyId: 'stay-goa-1' })
      .expect(201, { recorded: true });

    await request(app.getHttpServer())
      .get('/api/v1/admin/journey')
      .set('authorization', '******')
      .expect(403);

    await request(app.getHttpServer())
      .get('/api/v1/admin/bookings')
      .set('authorization', '******')
      .expect(403);
  });
});
