import { Goose } from './icons';

interface FlyingBirdProps {
  className?: string;
  cycleInterval?: number; // kept for API compatibility; unused after the rebrand
}

// Previously cycled goose flight frames while the agent streams. The Loukri
// AI CoWork logo pulses instead.
export default function FlyingBird({ className = '' }: FlyingBirdProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      <Goose className="w-4 h-4 rounded-full" />
    </div>
  );
}
