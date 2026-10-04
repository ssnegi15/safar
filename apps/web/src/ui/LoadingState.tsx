import { Skeleton } from '@mantine/core';

export function LoadingCards() {
  return (
    <div className="property-grid" aria-label="Loading stays" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="property-skeleton" key={index}>
          <Skeleton height={208} radius="lg" />
          <Skeleton height={18} mt="md" width="70%" />
          <Skeleton height={14} mt="sm" width="45%" />
          <Skeleton height={14} mt="sm" width="58%" />
        </div>
      ))}
    </div>
  );
}
