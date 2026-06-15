import { FaSpinner } from 'react-icons/fa';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ className, size = 12 }: SpinnerProps) {
  return <FaSpinner size={size} className={`animate-spin ${className}`} />;
}
