interface AdminPageContainerProps {
  children: React.ReactNode;
}

export function AdminPageContainer({ children }: AdminPageContainerProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </div>
  );
}
