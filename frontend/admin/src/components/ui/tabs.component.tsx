import { MdError } from 'react-icons/md';

export type Tab = {
  id: string;
  label: string;
  hasError?: boolean;
  icon?: React.ElementType;
};

type TabsProps = {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
};

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="inline-flex gap-1 rounded-full bg-bg p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={[
            'relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors',
            active === tab.id
              ? 'bg-card text-text shadow-sm'
              : 'text-text-muted hover:text-text-sub',
          ].join(' ')}
        >
          {tab.icon && <tab.icon size={14} />}
          {tab.label}
          {tab.hasError && (
            <MdError
              size={13}
              className="absolute -right-1 -top-1.5 text-danger drop-shadow-sm"
            />
          )}
        </button>
      ))}
    </div>
  );
}
