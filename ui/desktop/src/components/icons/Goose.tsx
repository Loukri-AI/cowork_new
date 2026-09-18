import logoUrl from '../../images/loukri-logo.png';

/**
 * Loukri AI CoWork logo. The legacy `Goose` / `Rain` export names are kept so
 * existing call sites keep working after the rebrand.
 */
export function Goose({ className = '' }: { className?: string }) {
  return <img src={logoUrl} alt="Loukri AI CoWork" className={className} draggable={false} />;
}

// The upstream logo animated a rain effect on hover; retired in the Loukri AI
// CoWork rebrand. Kept as a no-op for API compatibility (className accepted
// and ignored by JSX prop widening).
export function Rain() {
  return null;
}
