interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="animate-fade-in flex min-h-screen items-stretch justify-center md:items-center md:px-4 md:py-8 bg-auth-image">
      <div className="animate-slide-up w-full rounded-2xl bg-overlay p-9 shadow-2xl md:max-w-102.5 md:p-6">
        <div className="mb-7 text-center">
          <img
            src="/icons/icon-text.png"
            alt="Ícone da Guará"
            className="w-45 m-auto"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
