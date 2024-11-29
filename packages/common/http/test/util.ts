import { MockedFunction, vi } from 'vitest';

export const fetchMock = vi.fn() as MockedFunction<typeof fetch>;

export function createFetchResponse(
  data: Record<any, any> | string | null,
  statusCode: number = 200
) {
  return {
    json: () => new Promise((resolve) => resolve(data)),
    text: () => new Promise((resolve) => resolve(JSON.stringify(data))),
    ok: statusCode >= 200 && statusCode < 300,
    status: statusCode,
  } as unknown as Response;
}
