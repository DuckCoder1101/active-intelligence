interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="animate-fade-in flex min-h-screen items-stretch justify-center bg-linear-to-br from-sidebar via-navy to-sidebar md:items-center md:px-4 md:py-8">
      <div className="animate-slide-up w-full rounded-2xl bg-card p-9 shadow-2xl md:max-w-102.5 md:p-6">
        <div className="mb-7 text-center">
          <h1 className="text-xl font-black tracking-tight text-text">
            Guará
          </h1>
          <p className="mt-1.5 text-[9px] font-medium uppercase tracking-[1.2px] text-text-muted">
            Inteligência Imobiliária
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
