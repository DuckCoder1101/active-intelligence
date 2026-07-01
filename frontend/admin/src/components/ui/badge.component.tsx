type BadgeVariant = 'default' | 'orange' | 'success' | 'danger' | 'purple' | 'teal';

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: 'border border-border text-text-sub bg-card',
  orange: 'bg-orange text-white',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  purple: 'bg-purple/10 text-purple',
  teal: 'bg-teal/10 text-teal',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
