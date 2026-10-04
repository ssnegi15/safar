import { useQuery } from '@tanstack/react-query';
import { Alert, Badge, Button, Container, Skeleton, Text } from '@mantine/core';
import { ArrowLeft, Check, MapPin, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { fetchAvailability, fetchProperty, recordJourneyEvent } from '../api';
import { useAuth } from '../auth/AuthProvider';
import { QueryError } from '../ui/QueryError';

const rupees = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function PropertyPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const trackedViews = useRef(new Set<string>());
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const guests = Math.min(12, Math.max(1, Number(searchParams.get('guests')) || 2));
  const checkIn = searchParams.get('checkIn') ?? undefined;
  const checkOut = searchParams.get('checkOut') ?? undefined;
  const property = useQuery({
    queryKey: ['property', id],
    queryFn: () => fetchProperty(id!),
    enabled: Boolean(id),
  });
  const availability = useQuery({
    queryKey: ['availability', id, guests, checkIn, checkOut],
    queryFn: () => fetchAvailability(id!, guests, checkIn, checkOut),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!user || !property.data || !id || trackedViews.current.has(id)) return;
    trackedViews.current.add(id);
    void recordJourneyEvent({
      eventId: crypto.randomUUID(),
      eventType: 'property_viewed',
      propertyId: id,
    }).catch((error: Error) => {
      trackedViews.current.delete(id);
      setTrackingError(error.message);
    });
  }, [id, property.data, user]);

  if (property.isPending) {
    return (
      <Container size="xl" className="detail-page">
        <Skeleton height={460} radius="xl" />
        <Skeleton height={34} mt="xl" width="55%" />
        <Skeleton height={18} mt="sm" width="35%" />
      </Container>
    );
  }
  if (property.isError) {
    return (
      <Container size="xl" className="detail-page">
        <QueryError message={property.error.message} onRetry={() => void property.refetch()} />
      </Container>
    );
  }

  const stay = property.data;
  const rateSnapshot = availability.data;
  const nightly = rateSnapshot?.amountPerNight;

  return (
    <Container size="xl" className="detail-page">
      <Link to="/search" className="back-link">
        <ArrowLeft size={16} /> Back to stays
      </Link>
      {trackingError && (
        <Alert color="yellow" role="status" mb="md">
          We couldn’t update the journey metrics: {trackingError}
        </Alert>
      )}
      <div className="detail-heading">
        <div>
          <span className="overline">{stay.propertyType.toUpperCase()} · SYNTHETIC LISTING</span>
          <h1>{stay.name}</h1>
          <p className="detail-location">
            <MapPin size={16} /> {stay.address}, {stay.city}, {stay.state}
          </p>
        </div>
        <div className="detail-rating">
          <span><Star size={16} fill="currentColor" /> {stay.rating.toFixed(1)}</span>
          <Text size="sm" c="dimmed">{stay.reviewCount} synthetic demo reviews</Text>
        </div>
      </div>

      <div className="detail-gallery">
        {stay.images.map((image, index) => (
          <img
            key={image.url}
            className={index === 0 ? 'detail-main-image' : 'detail-side-image'}
            src={image.url}
            alt={image.alt}
          />
        ))}
      </div>

      <div className="detail-layout">
        <div className="detail-main-column">
          <div className="detail-intro">
            <div>
              <h2>A considered base in {stay.city}.</h2>
              <p>{stay.description}</p>
            </div>
            <Badge color="teal" variant="light" radius="xl">{stay.starRating}-star style</Badge>
          </div>
          <div className="amenity-list" aria-label="Property amenities">
            {stay.amenities.map((amenity) => (
              <span key={amenity}><Check size={15} /> {amenity}</span>
            ))}
          </div>

          <section className="room-section">
            <div className="section-heading compact">
              <div>
                <span className="overline">MAKE YOURSELF AT HOME</span>
                <h2>Rooms with room to breathe.</h2>
              </div>
            </div>
            {availability.isError && (
              <Alert color="red" title="Rate unavailable" role="alert">
                {availability.error.message}
              </Alert>
            )}
            <div className="room-list">
              {stay.rooms.map((room) => (
                <article className="room-card" key={room.id}>
                  <div className="room-mark" aria-hidden="true">⌂</div>
                  <div className="room-info">
                    <h3>{room.name}</h3>
                    <p>{room.bedConfiguration} · up to {room.maxOccupancy} guests</p>
                    <div className="room-amenities">
                      {room.amenities.map((item) => <span key={item}>{item}</span>)}
                    </div>
                    <p className="cancellation">{room.cancellationPolicy}</p>
                  </div>
                  <div className="room-price">
                    {availability.isPending ? (
                      <Skeleton height={24} width={90} />
                    ) : nightly !== undefined && rateSnapshot ? (
                      <>
                        <strong>₹{rupees.format(nightly)}</strong>
                        <span>per night, before taxes</span>
                        <span>+ ₹{rupees.format(rateSnapshot.taxesAndFees)} taxes (demo)</span>
                        <span>
                          {rateSnapshot.availability === 'limited'
                            ? `Limited demo inventory · ${rateSnapshot.availableRooms} rooms`
                            : `${rateSnapshot.availableRooms} demo rooms`}
                        </span>
                      </>
                    ) : (
                      <span>Rate unavailable</span>
                    )}
                    <Button
                      component={Link}
                      to={`/hotels/${stay.id}/book?guests=${guests}${checkIn ? `&checkIn=${encodeURIComponent(checkIn)}` : ''}${checkOut ? `&checkOut=${encodeURIComponent(checkOut)}` : ''}`}
                      variant="filled"
                      color="teal"
                      size="xs"
                      mt="sm"
                      disabled={availability.isSuccess && availability.data.availableRooms < 1}
                    >
                      {availability.isSuccess && availability.data.availableRooms < 1
                        ? 'Sold out for these dates'
                        : 'Book this room'}
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
        <aside className="detail-aside">
          <div className="map-card">
            <div className="map-art">
              <span className="map-pin"><MapPin size={19} fill="currentColor" /></span>
              <span className="map-label">{stay.city}</span>
            </div>
            <div className="map-card-copy">
              <h3>A good spot to explore from.</h3>
              <p>{stay.address}, {stay.city}, {stay.state}</p>
              <a
                href={`https://www.google.com/maps?q=${stay.latitude},${stay.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                View area <ArrowLeft size={14} />
              </a>
            </div>
          </div>
          <div className="privacy-note">
            <strong>Just so you know</strong>
            <p>This is synthetic demo inventory. Prices and availability are examples, not real offers.</p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
