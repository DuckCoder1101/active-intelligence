import { MdSearch } from 'react-icons/md';

export interface ListFilterOption<T extends string = string> {
  value: T;
  label: string;
}

interface ListToolbarProps<T extends string = string> {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterOptions?: ListFilterOption<T>[];
  filterValue?: T;
  onFilterChange?: (value: T) => void;
}

export function ListToolbar<T extends string = string>({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filterOptions,
  filterValue,
  onFilterChange,
}: ListToolbarProps<T>) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1">
        <MdSearch
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-md border border-border bg-card py-2 pl-9 pr-3 text-sm text-text outline-none placeholder:text-text-muted transition-colors focus:border-primary"
        />
      </div>

      {filterOptions && filterOptions.length > 0 && (
        <div className="inline-flex shrink-0 gap-1 rounded-full bg-bg p-1">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onFilterChange?.(option.value)}
              className={[
                'rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors',
                filterValue === option.value
                  ? 'bg-card text-text shadow-sm'
                  : 'text-text-muted hover:text-text-sub',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
