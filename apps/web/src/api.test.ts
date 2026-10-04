import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchProperties } from './api';

describe('travel API client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('preserves URL search state and applies safe pagination defaults', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ items: [], page: 1, pageSize: 12, total: 0, totalPages: 0 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await fetchProperties(new URLSearchParams({ destination: 'Goa', guests: '3' }));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/properties?destination=Goa&guests=3&page=1&pageSize=12',
      { headers: { Accept: 'application/json' } },
    );
  });

  it('surfaces server error details and the correlation id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          code: 'VALIDATION_ERROR',
          message: 'Check-out must be after check-in',
          requestId: 'request-123',
        }),
      }),
    );

    await expect(fetchProperties(new URLSearchParams())).rejects.toThrow(
      'Check-out must be after check-in (request request-123)',
    );
  });
});
