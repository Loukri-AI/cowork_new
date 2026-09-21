import { useEffect, useState } from 'react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { useConfig } from '../../ConfigContext';
import { TOKENKEY_IDENTITY_KEY, type TokenKeyIdentity } from '../../onboarding/TokenKeySignIn';
import { defineMessages, useIntl } from '../../../i18n';

const i18n = defineMessages({
  title: { id: 'tokenKeyAccount.title', defaultMessage: 'TokenKey account' },
  description: {
    id: 'tokenKeyAccount.description',
    defaultMessage: 'Who this copy of CoWork is signed in as, and the key it uses.',
  },
  pasted: {
    id: 'tokenKeyAccount.pasted',
    defaultMessage:
      'Connected with a pasted key. Sign out to switch to signing in through tokenkey.in.',
  },
  signedInAs: { id: 'tokenKeyAccount.signedInAs', defaultMessage: 'Signed in as' },
  organisation: { id: 'tokenKeyAccount.organisation', defaultMessage: 'Organisation' },
  key: { id: 'tokenKeyAccount.key', defaultMessage: 'Key for this computer' },
  since: { id: 'tokenKeyAccount.since', defaultMessage: 'Since' },
  signOut: { id: 'tokenKeyAccount.signOut', defaultMessage: 'Sign out' },
  signOutHint: {
    id: 'tokenKeyAccount.signOutHint',
    defaultMessage:
      'Removes the key from this computer and returns to the sign-in screen. Conversations stay on this computer. To stop the key itself, revoke it in the TokenKey console.',
  },
  manage: { id: 'tokenKeyAccount.manage', defaultMessage: 'Open the TokenKey console' },
});

export default function TokenKeyAccountSection() {
  const intl = useIntl();
  const { read, remove } = useConfig();
  const [identity, setIdentity] = useState<TokenKeyIdentity | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const value = await read(TOKENKEY_IDENTITY_KEY, false);
        if (value && typeof value === 'object' && 'user' in (value as object)) {
          setIdentity(value as TokenKeyIdentity);
        }
      } catch {
        // No identity stored: a pasted key, or a fresh install.
      } finally {
        setLoaded(true);
      }
    })();
  }, [read]);

  const signOut = async () => {
    setBusy(true);
    try {
      await remove('TOKENKEY_API_KEY', true).catch(() => undefined);
      await remove(TOKENKEY_IDENTITY_KEY, false).catch(() => undefined);
      await remove('GOOSE_PROVIDER', false).catch(() => undefined);
      await remove('GOOSE_MODEL', false).catch(() => undefined);
      window.electron.reloadApp();
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>{intl.formatMessage(i18n.title)}</CardTitle>
        <CardDescription>{intl.formatMessage(i18n.description)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {identity ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
            <dt className="text-text-muted">{intl.formatMessage(i18n.signedInAs)}</dt>
            <dd>
              {identity.user.name}{' '}
              <span className="text-text-muted">({identity.user.email})</span>
            </dd>
            <dt className="text-text-muted">{intl.formatMessage(i18n.organisation)}</dt>
            <dd>
              {identity.tenant.name}{' '}
              <span className="text-text-muted font-mono text-xs">{identity.tenant.slug}</span>
            </dd>
            {identity.key && (
              <>
                <dt className="text-text-muted">{intl.formatMessage(i18n.key)}</dt>
                <dd className="font-mono text-xs">{identity.key.display}</dd>
              </>
            )}
            <dt className="text-text-muted">{intl.formatMessage(i18n.since)}</dt>
            <dd>{new Date(identity.signedInAt).toLocaleString()}</dd>
          </dl>
        ) : (
          <p className="text-sm text-text-muted">{intl.formatMessage(i18n.pasted)}</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={signOut} disabled={busy}>
            {intl.formatMessage(i18n.signOut)}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => window.electron.openExternal('https://tokenkey.in/dashboard/keys')}
          >
            {intl.formatMessage(i18n.manage)}
          </Button>
        </div>
        <p className="text-xs text-text-muted">{intl.formatMessage(i18n.signOutHint)}</p>
      </CardContent>
    </Card>
  );
}
