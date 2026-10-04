import { Anchor, Badge, Button, Container, Group, Skeleton, Text } from '@mantine/core';
import { Activity, Compass, Heart, MapPinned, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthProvider';

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  return (
    <>
      <header className="site-header">
        <Container size="xl" className="header-content">
          <Anchor component={Link} to="/" className="brand" aria-label="Safar home">
            <span className="brand-mark" aria-hidden="true">
              <Compass size={20} strokeWidth={2.5} />
            </span>
            safar
            <span className="brand-period">.</span>
          </Anchor>
          <nav aria-label="Main navigation" className="desktop-nav">
            <Anchor
              component={Link}
              to="/search"
              className={location.pathname === '/search' ? 'nav-link active' : 'nav-link'}
            >
              Stays
            </Anchor>
            {user && (
              <>
                {user.isAdmin && (
                  <Anchor component={Link} to="/admin/journey" className={location.pathname === '/admin/journey' ? 'nav-link active' : 'nav-link'}>
                    <Activity size={14} /> <span>Journey</span>
                  </Anchor>
                )}
                <Anchor component={Link} to="/trips" className={location.pathname.startsWith('/trips') ? 'nav-link active' : 'nav-link'}>
                  <MapPinned size={14} /> <span>Trips</span>
                </Anchor>
                <Anchor component={Link} to="/favorites" className={location.pathname === '/favorites' ? 'nav-link active' : 'nav-link'}>
                  <Heart size={14} /> <span>Saved</span>
                </Anchor>
              </>
            )}
          </nav>
          <Group gap="sm">
            <Badge className="demo-badge" variant="light" color="teal" radius="xl">
              DEMO INVENTORY
            </Badge>
            {loading ? (
              <Skeleton height={34} width={94} radius="xl" />
            ) : (
              <Button
                component={Link}
                to={user ? '/profile' : '/login'}
                variant="default"
                radius="xl"
                className="header-cta"
                leftSection={<UserRound size={15} />}
              >
                {user ? 'My profile' : 'Sign in'}
              </Button>
            )}
          </Group>
        </Container>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <Container size="xl" className="footer-content">
          <div className="footer-brand">
            <span className="brand-mark small" aria-hidden="true">
              <Compass size={16} />
            </span>
            <Text fw={700}>safar.</Text>
          </div>
          <Text size="sm" c="dimmed">
            Thoughtful stays for the long way round.
          </Text>
          <Text size="xs" c="dimmed" className="footer-note">
            All listings and rates are synthetic demo data, not real offers.
          </Text>
        </Container>
      </footer>
    </>
  );
}
