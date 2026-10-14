import type { ApiErrorCode } from '@sudobility/characterbuilder_types';

/** Codes the client itself raises (never sent by the server). */
export type ClientErrorCode = 'NETWORK_ERROR' | 'BAD_RESPONSE';

/** Thrown for every failed REST call: a failure envelope, a non-2xx status, or a transport failure. */
export class ApiError extends Error {
  override readonly name: string = 'ApiError';
  constructor(
    message: string,
    readonly code: ApiErrorCode | ClientErrorCode,
    /** HTTP status; 0 when no response was received. */
    readonly status: number,
    readonly details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/** 402 INSUFFICIENT_CREDITS: the account cannot afford this generation. */
export class InsufficientCreditsError extends ApiError {
  override readonly name: string = 'InsufficientCreditsError';
  constructor(
    message: string,
    status: number,
    details?: Record<string, unknown>
  ) {
    super(message, 'INSUFFICIENT_CREDITS', status, details);
  }
  get required(): number | undefined {
    return this.details?.required as number | undefined;
  }
  get balance(): number | undefined {
    return this.details?.balance as number | undefined;
  }
}
export const isInsufficientCredits = (
  e: unknown
): e is InsufficientCreditsError => e instanceof InsufficientCreditsError;

/** The right `ApiError` subclass for a failure envelope. */
export function apiErrorFrom(
  message: string,
  code: ApiErrorCode | ClientErrorCode,
  status: number,
  details?: Record<string, unknown>
): ApiError {
  if (code === 'INSUFFICIENT_CREDITS') {
    return new InsufficientCreditsError(message, status, details);
  }
  return new ApiError(message, code, status, details);
}
