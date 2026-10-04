import { Button, Container } from '@mantine/core';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <Container size="sm" className="empty-state not-found-state">
      <span className="overline">A WRONG TURN</span>
      <h1>We couldn’t find that page.</h1>
      <p>Try heading back to the stays we know are here.</p>
      <Button component={Link} to="/search" className="filter-submit">
        Explore stays
      </Button>
    </Container>
  );
}
