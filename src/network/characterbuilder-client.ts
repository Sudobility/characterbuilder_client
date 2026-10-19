import {
  ROUTES,
  type Character,
  type ComposeRequestInput,
  type ComposeResponse,
  type ConsumableBalanceResponse,
  type CreateCharacterRequest,
  type CreditProduct,
  type DistributionRequest,
  type DistributionResponse,
  type Generation,
  type GenerateRequestInput,
  type MeResponse,
  type Paginated,
  type UpdateCharacterRequest,
} from '@sudobility/characterbuilder_types';
import { ApiError, apiErrorFrom } from '../errors';
import {
  type HttpMethod,
  type NetworkClient,
  type NetworkResponse,
} from './network-client';

const API_BASE_PATH = '/api/v1';

type Query = Record<string, string | number | undefined>;

export interface CharacterBuilderClientOptions {
  network: NetworkClient;
  /** API origin, e.g. `http://localhost:8040` (no `/api/v1`). */
  baseUrl: string;
  /** Bearer token supplier; `forceRefresh` is true on the one retry after a 401. Null = signed out. */
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
  /** Sent as `X-Client`, e.g. `web/0.1.0`. */
  clientTag?: string;
}

/** Typed REST client for characterbuilder_api. Every method returns the unwrapped `data`. */
export class CharacterBuilderClient {
  constructor(private readonly opts: CharacterBuilderClientOptions) {}

  private url(path: string, query?: Query): string {
    const base = this.opts.baseUrl.replace(/\/+$/, '');
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query ?? {}))
      if (v !== undefined) qs.set(k, String(v));
    const q = qs.toString();
    return `${base}${API_BASE_PATH}${path}${q ? `?${q}` : ''}`;
  }

  private async send(
    method: HttpMethod,
    path: string,
    query?: Query,
    body?: unknown,
    forceRefresh = false
  ): Promise<NetworkResponse> {
    const token = await this.opts.getToken(forceRefresh);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (this.opts.clientTag) headers['X-Client'] = this.opts.clientTag;
    let payload: string | undefined;
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    let res: NetworkResponse;
    try {
      res = await this.opts.network.request({
        method,
        url: this.url(path, query),
        headers,
        body: payload,
      });
    } catch (e) {
      throw new ApiError(
        e instanceof Error ? e.message : 'Network error',
        'NETWORK_ERROR',
        0
      );
    }
    // One token refresh after a 401.
    if (res.status === 401 && !forceRefresh) {
      return this.send(method, path, query, body, true);
    }
    return res;
  }

  private fail(res: NetworkResponse): never {
    let env: unknown;
    try {
      env = JSON.parse(new TextDecoder().decode(res.body));
    } catch {
      /* not JSON */
    }
    if (
      env &&
      typeof env === 'object' &&
      (env as { success?: unknown }).success === false
    ) {
      const f = env as {
        error?: string;
        code?: string;
        details?: Record<string, unknown>;
      };
      throw apiErrorFrom(
        f.error ?? `HTTP ${res.status}`,
        (f.code ?? 'INTERNAL') as ApiError['code'],
        res.status,
        f.details
      );
    }
    throw new ApiError(`HTTP ${res.status}`, 'BAD_RESPONSE', res.status);
  }

  private async json<T>(
    method: HttpMethod,
    path: string,
    query?: Query,
    body?: unknown
  ): Promise<T> {
    const res = await this.send(method, path, query, body);
    if (res.status < 200 || res.status >= 300) this.fail(res);
    try {
      const env = JSON.parse(new TextDecoder().decode(res.body)) as {
        success?: boolean;
        data?: T;
      };
      if (env.success !== true) throw new Error('not a success envelope');
      return env.data as T;
    } catch {
      throw new ApiError(
        'Malformed response envelope',
        'BAD_RESPONSE',
        res.status
      );
    }
  }

  // ── me ──
  me() {
    return this.json<MeResponse>('GET', ROUTES.me);
  }

  // ── characters ──
  listCharacters(query?: { limit?: number; cursor?: string }) {
    return this.json<Paginated<Character>>('GET', ROUTES.characters, query);
  }
  getCharacter(id: string) {
    return this.json<Character>('GET', ROUTES.character(id));
  }
  createCharacter(req: CreateCharacterRequest) {
    return this.json<Character>('POST', ROUTES.characters, undefined, req);
  }
  updateCharacter(id: string, req: UpdateCharacterRequest) {
    return this.json<Character>('PATCH', ROUTES.character(id), undefined, req);
  }
  deleteCharacter(id: string) {
    return this.json<{ deleted: boolean }>('DELETE', ROUTES.character(id));
  }

  // ── generation ──
  compose(req: ComposeRequestInput) {
    return this.json<ComposeResponse>(
      'POST',
      ROUTES.composePrompt,
      undefined,
      req
    );
  }
  /** Demographics -> per-trait probability maps (the casting odds to display). */
  getDistributions(req: DistributionRequest) {
    return this.json<DistributionResponse>(
      'POST',
      ROUTES.distributions,
      undefined,
      req
    );
  }
  generate(req: GenerateRequestInput) {
    return this.json<Generation>('POST', ROUTES.generate, undefined, req);
  }
  listGenerations(query?: { limit?: number; cursor?: string }) {
    return this.json<Paginated<Generation>>('GET', ROUTES.generations, query);
  }
  getGeneration(id: string) {
    return this.json<Generation>('GET', ROUTES.generation(id));
  }

  /** Fetch raw image bytes (authenticated); the app wraps them in an object URL. */
  async getImageBytes(id: string): Promise<Blob> {
    const res = await this.send('GET', ROUTES.image(id));
    if (res.status < 200 || res.status >= 300) this.fail(res);
    const type = res.headers['content-type'] ?? 'image/png';
    return new Blob([res.body as BlobPart], { type });
  }

  // ── credits ──
  getBalance() {
    return this.json<ConsumableBalanceResponse>(
      'GET',
      ROUTES.consumablesBalance
    );
  }
  getProducts() {
    return this.json<CreditProduct[]>('GET', ROUTES.consumablesProducts);
  }
}
