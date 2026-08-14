interface AdminPageContainerProps {
  children: React.ReactNode;
  /** Relaxa o max-width e reduz o padding lateral — pra telas com tabelas largas. */
  wide?: boolean;
}

export function AdminPageContainer({ children, wide }: AdminPageContainerProps) {
  return (
    <div
      className={`flex-1 overflow-y-auto py-8 sm:py-12 ${wide ? 'px-3 sm:px-4' : 'px-4 sm:px-6'}`}
    >
      <div className={`mx-auto w-full ${wide ? 'max-w-400' : 'max-w-5xl'}`}>
        {children}
      </div>
    </div>
  );
}
