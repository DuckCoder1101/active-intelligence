interface Props {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}

export function Section({ icon: Icon, title, children }: Props) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Icon size={15} className="text-orange" />
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          {title}
        </p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
