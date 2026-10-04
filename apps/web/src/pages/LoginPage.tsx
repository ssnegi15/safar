import { Alert, Button, Container, Loader, PasswordInput, TextInput } from '@mantine/core';
import { ArrowRight, Compass, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export function LoginPage() {
  const {
    user,
    loading,
    error,
    signIn,
    signInWithEmail,
    createAccount,
    sendVerificationEmail,
    retryProfile,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [searchParams] = useSearchParams();
  const requestedReturnTo = searchParams.get('returnTo');
  const signedInTarget =
    requestedReturnTo?.startsWith('/') && !requestedReturnTo.startsWith('//')
      ? requestedReturnTo
      : '/profile';

  return (
    <Container size="sm" className="auth-page">
      <section className="auth-card" aria-labelledby="sign-in-heading">
        <span className="auth-icon"><Compass size={24} /></span>
        {user ? (
          <>
            <span className="overline">YOU’RE SIGNED IN</span>
            <h1 id="sign-in-heading">Welcome back, {user.displayName}.</h1>
            <p>Your personal trip space is ready when you are.</p>
            {user.email && !user.emailVerified && (
              <Alert color="yellow" title="Verify your email to finish setup" role="status" mb="md">
                Check your inbox for a verification link. Once verified, refresh your account status here.
                <Button variant="subtle" onClick={() => void sendVerificationEmail()} mt="xs">
                  Send verification email again
                </Button>
                <Button variant="subtle" onClick={retryProfile} mt="xs">
                  I verified my email
                </Button>
              </Alert>
            )}
            {error && <Alert color="red" role="alert" mb="md">{error}</Alert>}
            <Button component={Link} to={signedInTarget} className="filter-submit" rightSection={<ArrowRight size={16} />}>
              {signedInTarget === '/profile' ? 'View your profile' : 'Continue'}
            </Button>
            {user.isAdmin && (
              <Button component={Link} to="/admin/journey" variant="default" mt="sm">
                View journey metrics
              </Button>
            )}
          </>
        ) : (
          <>
            <span className="overline">YOUR JOURNEY, IN ONE PLACE</span>
            <h1 id="sign-in-heading">Welcome to Safar.</h1>
            <p>Sign in to set up your personal space for the trips you’ll remember.</p>
            <div className="auth-provider-note">
              <ShieldCheck size={17} />
              <span>
                Your account is secured by Firebase Authentication. Email accounts can access admin tools when authorized.
              </span>
            </div>
            {error && (
              <Alert color="red" title="Sign-in needs another try" role="alert">
                {error}
                <Button variant="subtle" onClick={retryProfile} mt="xs">
                  Retry account check
                </Button>
              </Alert>
            )}
            <form
              className="login-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (creatingAccount) {
                  void createAccount(email, password);
                } else {
                  void signInWithEmail(email, password);
                }
              }}
            >
              <TextInput
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                required
              />
              <PasswordInput
                label="Password"
                autoComplete={creatingAccount ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                minLength={6}
                required
              />
              <Button
                type="submit"
                className="filter-submit auth-submit"
                rightSection={loading ? <Loader size={15} color="white" /> : <ArrowRight size={16} />}
                disabled={loading}
              >
                {creatingAccount ? 'Create account' : 'Sign in with email'}
              </Button>
            </form>
            <Button
              variant="subtle"
              size="compact-sm"
              onClick={() => setCreatingAccount((current) => !current)}
            >
              {creatingAccount ? 'Already have an account? Sign in' : 'New here? Create an account'}
            </Button>
            <div className="login-divider"><span>or</span></div>
            <Button
              variant="default"
              className="auth-submit"
              rightSection={<ArrowRight size={16} />}
              disabled={loading}
              onClick={() => void signIn()}
            >
              Continue as a demo traveler
            </Button>
            <small>Email/password sign-up sends a verification email. Demo travelers can continue without one.</small>
          </>
        )}
      </section>
    </Container>
  );
}
