import { Alert, Button, Stack, Text } from '@mantine/core';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function QueryError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert
      className="query-error"
      color="red"
      icon={<AlertCircle size={18} />}
      title="We couldn't load this just now"
      role="alert"
    >
      <Stack gap="sm">
        <Text size="sm">{message}</Text>
        <Button
          onClick={onRetry}
          variant="light"
          color="red"
          leftSection={<RefreshCw size={15} />}
          w="fit-content"
        >
          Try again
        </Button>
      </Stack>
    </Alert>
  );
}
