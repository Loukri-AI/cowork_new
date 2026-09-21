import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { useConfig } from '../ConfigContext';
import { acpSaveProviderConfig } from '../../acp/providers';
import { defineMessages, useIntl } from '../../i18n';

export const TOKENKEY_IDENTITY_KEY = 'TOKENKEY_IDENTITY';

export interface TokenKeyIdentity {
  user: { id: string; email: string; name: string; role: string };
  tenant: { slug: string; name: string; kind: string };
  key: { display: string; name: string } | null;
  signedInAt: string;
}

interface SignedInPayload extends TokenKeyIdentity {
  apiKey: string;
}

const i18n = defineMessages({
  signIn: { id: 'tokenKeySignIn.signIn', defaultMessage: 'Sign in with TokenKey' },
  waiting: {
    id: 'tokenKeySignIn.waiting',
    defaultMessage: 'Finish signing in in your browser. This window will update on its own.',
  },
  cancel: { id: 'tokenKeySignIn.cancel', defaultMessage: 'Cancel' },
  saving: { id: 'tokenKeySignIn.saving', defaultMessage: 'Signed in. Setting up…' },
  explain: {
    id: 'tokenKeySignIn.explain',
    defaultMessage:
      'Your browser opens tokenkey.in. Sign in, or register through your organisation, and CoWork receives a key made for this computer. You never have to copy one.',
  },
  or: { id: 'tokenKeySignIn.or', defaultMessage: 'or paste a key you already have' },
  failed: { id: 'tokenKeySignIn.failed', defaultMessage: 'Sign-in did not complete: {message}' },
});

/**
 * "Sign in with TokenKey": the browser does the signing in, the app gets a key.
 *
 * The main process holds the verifier and redeems the code; this component
 * only starts the flow and, when the main process reports success, stores
 * the key where a pasted key would go and remembers who signed in.
 */
export default function TokenKeySignIn({
  onConfigured,
}: {
  onConfigured: (providerName: string, modelId?: string) => void | Promise<void>;
}) {
  const intl = useIntl();
  const { upsert } = useConfig();
  const [state, setState] = useState<'idle' | 'waiting' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const onSignedIn = async (_event: unknown, payload: unknown) => {
      const data = payload as SignedInPayload;
      setState('saving');
      setError(null);
      try {
        await acpSaveProviderConfig('tokenkey', [{ key: 'TOKENKEY_API_KEY', value: data.apiKey }]);
        const identity: TokenKeyIdentity = {
          user: data.user,
          tenant: data.tenant,
          key: data.key,
          signedInAt: data.signedInAt,
        };
        await upsert(TOKENKEY_IDENTITY_KEY, identity, false);
        await onConfigured('tokenkey', 'tk-auto');
      } catch (err) {
        setState('idle');
        setError(err instanceof Error ? err.message : String(err));
      }
    };
    const onFailed = (_event: unknown, payload: unknown) => {
      const { message } = (payload ?? {}) as { message?: string };
      setState('idle');
      setError(message || 'unknown error');
    };
    window.electron.on('tokenkey-signed-in', onSignedIn);
    window.electron.on('tokenkey-sign-in-failed', onFailed);
    return () => {
      window.electron.off('tokenkey-signed-in', onSignedIn);
      window.electron.off('tokenkey-sign-in-failed', onFailed);
    };
  }, [onConfigured, upsert]);

  const start = async () => {
    setError(null);
    setState('waiting');
    try {
      await window.electron.startTokenKeyLogin();
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const cancel = async () => {
    await window.electron.cancelTokenKeyLogin();
    setState('idle');
  };

  return (
    <div className="mb-6">
      <p className="text-sm text-text-muted mb-3">{intl.formatMessage(i18n.explain)}</p>
      {state === 'idle' && (
        <Button type="button" onClick={start} className="w-full">
          {intl.formatMessage(i18n.signIn)}
        </Button>
      )}
      {state === 'waiting' && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-muted flex-1">{intl.formatMessage(i18n.waiting)}</span>
          <Button type="button" variant="ghost" onClick={cancel}>
            {intl.formatMessage(i18n.cancel)}
          </Button>
        </div>
      )}
      {state === 'saving' && (
        <span className="text-sm text-text-muted">{intl.formatMessage(i18n.saving)}</span>
      )}
      {error && (
        <p className="text-sm text-red-500 mt-2">
          {intl.formatMessage(i18n.failed, { message: error })}
        </p>
      )}
      <div className="flex items-center gap-3 my-5">
        <div className="h-px flex-1 bg-border-default" />
        <span className="text-xs uppercase tracking-wide text-text-muted">
          {intl.formatMessage(i18n.or)}
        </span>
        <div className="h-px flex-1 bg-border-default" />
      </div>
    </div>
  );
}
