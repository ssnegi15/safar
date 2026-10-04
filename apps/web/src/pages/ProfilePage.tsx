import { Alert, Button, Container, Skeleton, Text } from '@mantine/core';
import { LogOut, ShieldCheck, UserRound } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { QueryError } from '../ui/QueryError';

export function ProfilePage() {
  const { user, loading, error, signIn, signOut, retryProfile } = useAuth();

  if (loading) {
    return (
      <Container size="md" className="profile-page" aria-busy="true">
        <Skeleton height={38} width="50%" />
        <Skeleton height={190} mt="lg" radius="lg" />
      </Container>
    );
  }
  if (!user) {
    if (error) {
      return (
        <Container size="md" className="profile-page">
          <>
            <QueryError message={error} onRetry={retryProfile} />
            <Button onClick={() => void signIn()}>Sign in again</Button>
          </>
        </Container>
      );
    }
    return <Navigate to="/login" replace />;
  }

  return (
    <Container size="md" className="profile-page">
      <span className="overline">YOUR ACCOUNT</span>
      <h1>Your personal space.</h1>
      <p className="profile-subtitle">Your Safar profile and private trip workspace.</p>

      <section className="profile-card" aria-labelledby="profile-details-heading">
        <div className="profile-avatar"><UserRound size={25} /></div>
        <div className="profile-main">
          <h2 id="profile-details-heading">{user.displayName}</h2>
          {user.email && <Text c="dimmed" size="sm">{user.email}</Text>}
        </div>
        <span className="profile-role"><ShieldCheck size={14} /> OWNER</span>
        <div className="profile-divider" />
        <div className="personal-tenant">
          <span className="overline">PERSONAL TENANT</span>
          <h3>{user.tenant.name}</h3>
          <p>Only your signed-in identity can access this private workspace.</p>
        </div>
        <div className="profile-footer">
          <Text size="xs" c="dimmed">Trip planning features are being built next.</Text>
          <Button variant="default" leftSection={<LogOut size={15} />} onClick={() => void signOut()}>
            Sign out
          </Button>
        </div>
      </section>
      <Alert color="teal" variant="light" mt="lg">
        Your identity is verified by the configured authentication provider. Safar resolves your personal tenant server-side; the browser cannot choose a tenant ID.
      </Alert>
    </Container>
  );
}
