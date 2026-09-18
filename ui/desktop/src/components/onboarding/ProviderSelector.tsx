import { useState, useEffect } from 'react';
import { acpListSetupProviderDetails } from '../../acp/providers';
import type { ProviderDetails } from '../../types/providers';
import ProviderConfigForm from './ProviderConfigForm';

interface ProviderSelectorProps {
  onConfigured: (providerName: string, modelId?: string) => void | Promise<void>;
  onFirstSelection?: () => void;
}

// Loukri AI CoWork distribution: TokenKey (tokenkey.in) is the only bundled
// provider, so onboarding renders its key form directly instead of a picker.
export default function ProviderSelector({
  onConfigured,
  onFirstSelection,
}: ProviderSelectorProps) {
  const [providerList, setProviderList] = useState<ProviderDetails[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setProviderList(await acpListSetupProviderDetails());
      } catch (err) {
        console.error('Failed to fetch providers:', err);
      }
    };
    load();
  }, []);

  const provider = providerList[0] ?? null;

  useEffect(() => {
    if (provider) onFirstSelection?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider?.name]);

  if (!provider) return null;

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
      <ProviderConfigForm key={provider.name} provider={provider} onConfigured={onConfigured} />
    </div>
  );
}
