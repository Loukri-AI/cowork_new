import { describe, expect, it } from 'vitest';
import { RequestError } from '@agentclientprotocol/sdk';
import {
  formatAcpError,
  parseAcpCreditsExhaustedError,
  isAcpContextLengthExceeded,
} from '../errors';

describe('formatAcpError', () => {
  it('explains how to recover from an authentication error', () => {
    expect(formatAcpError(RequestError.authRequired())).toBe(
      'Sign in to your provider, then try again.'
    );
  });
});

describe('parseAcpCreditsExhaustedError', () => {
  it('parses structured ACP credits exhausted errors', () => {
    expect(
      parseAcpCreditsExhaustedError({
        code: -32603,
        message: 'Please add credits to your account, then resend your message to continue.',
        data: {
          reason: 'credits_exhausted',
          url: 'https://router.tetrate.ai/billing',
        },
      })
    ).toEqual({
      message: 'Please add credits to your account, then resend your message to continue.',
      url: 'https://router.tetrate.ai/billing',
    });
  });

  it('parses wrapped JSON-RPC errors', () => {
    expect(
      parseAcpCreditsExhaustedError({
        error: {
          code: -32603,
          message: 'Add credits to continue.',
          data: {
            reason: 'credits_exhausted',
          },
        },
      })
    ).toEqual({
      message: 'Add credits to continue.',
    });
  });

  it('ignores non-credits-exhausted errors', () => {
    expect(
      parseAcpCreditsExhaustedError({
        code: -32603,
        message: 'Something failed.',
        data: {
          reason: 'provider_error',
        },
      })
    ).toBeNull();
  });
});

describe('isAcpContextLengthExceeded', () => {
  it('recognises the context-length reason from the backend', () => {
    expect(
      isAcpContextLengthExceeded({
        message: 'Context length exceeded',
        data: { reason: 'context_length_exceeded' },
      })
    ).toBe(true);
  });

  it('does not match a different failure', () => {
    expect(
      isAcpContextLengthExceeded({
        message: 'Out of credits',
        data: { reason: 'credits_exhausted' },
      })
    ).toBe(false);
    expect(isAcpContextLengthExceeded(new Error('boom'))).toBe(false);
  });
});
