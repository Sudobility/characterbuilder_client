import { describe, it, expect } from 'vitest';
import { successResponse, errorResponse } from '@sudobility/types';
import { CharacterBuilderClient } from './characterbuilder-client';
import type { NetworkClient, NetworkResponse } from './network-client';
import { isInsufficientCredits } from '../errors';

function jsonResponse(status: number, body: unknown): NetworkResponse {
  return {
    status,
    headers: { 'content-type': 'application/json' },
    body: new TextEncoder().encode(JSON.stringify(body)),
  };
}

function fakeClient(
  handler: (method: string, url: string, body?: string) => NetworkResponse
): { client: CharacterBuilderClient; calls: string[] } {
  const calls: string[] = [];
  const network: NetworkClient = {
    async request(req) {
      calls.push(`${req.method} ${req.url}`);
      return handler(
        req.method,
        req.url,
        typeof req.body === 'string' ? req.body : undefined
      );
    },
  };
  const client = new CharacterBuilderClient({
    network,
    baseUrl: 'http://api.test',
    getToken: async () => 'tok',
    clientTag: 'web/test',
  });
  return { client, calls };
}

describe('CharacterBuilderClient', () => {
  it('unwraps a success envelope', async () => {
    const { client, calls } = fakeClient(() =>
      jsonResponse(200, successResponse({ userId: 'u1', credits: 5 }))
    );
    const me = await client.me();
    expect(me.credits).toBe(5);
    expect(calls[0]).toBe('GET http://api.test/api/v1/me');
  });

  it('builds query strings for lists', async () => {
    const { client, calls } = fakeClient(() =>
      jsonResponse(200, {
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
        pagination: { hasNextPage: false, nextCursor: null, pageSize: 10 },
      })
    );
    const page = await client.listCharacters({ limit: 10 });
    expect(calls[0]).toContain('/api/v1/characters?limit=10');
    expect(page.data).toEqual([]);
    expect(page.pagination.nextCursor).toBeNull();
  });

  it('maps a 402 to a typed insufficient-credits error', async () => {
    // The canonical envelope carries no error code or details, so the client
    // keys the typed error off the HTTP status alone.
    const { client } = fakeClient(() =>
      jsonResponse(402, errorResponse('nope'))
    );
    await expect(client.generate({ spec: {} })).rejects.toSatisfy(
      (e: unknown) => isInsufficientCredits(e)
    );
  });

  it('retries once on 401 then succeeds', async () => {
    let n = 0;
    const { client, calls } = fakeClient(() => {
      n += 1;
      return n === 1
        ? jsonResponse(401, errorResponse('expired'))
        : jsonResponse(200, successResponse({ prompt: 'hi' }));
    });
    const r = await client.compose({ spec: {} });
    expect(r.prompt).toBe('hi');
    expect(calls.length).toBe(2);
  });
});
