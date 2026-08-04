interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="animate-fade-in flex min-h-screen items-center justify-center px-4 py-8 bg-auth-image">
      <div className="animate-slide-up w-full rounded-2xl p-9 md:max-w-102.5 md:bg-overlay md:p-6 md:shadow-2xl">
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
