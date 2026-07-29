import { MdCheckCircle, MdClose } from 'react-icons/md';

const HIGHLIGHTS = [
  'Acompanhe o andamento das suas tarefas em tempo real',
  'Veja o funil de vendas do seu negócio',
  'Fale com o suporte direto pela barra lateral',
];

interface Props {
  companyName?: string;
  onClose: () => void;
}

export function WelcomeModal({ companyName, onClose }: Props) {
  return (
    <div className="modal-overlay bg-black/70">
      <div className="flex w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        {/* Conteúdo */}
        <div className="flex w-full flex-col justify-center gap-4 p-8 sm:w-3/5">
          <span className="text-[11px] font-bold uppercase tracking-[1px] text-orange">
            Bem-vindo
          </span>
          <h2 className="text-2xl font-black leading-tight text-text">
            Bem-vindo{companyName ? `, ${companyName}` : ''}!
          </h2>
          <p className="text-[13px] text-text-sub">
            Essa é a sua área exclusiva com a Active. Por aqui você acompanha
            tarefas, funil de vendas e todo o cronograma da sua conta em um só
            lugar.
          </p>

          <div className="mt-1 space-y-2.5">
            {HIGHLIGHTS.map((item) => (
              <div key={item} className="flex items-start gap-2 text-[13px] text-text-sub">
                <MdCheckCircle size={16} className="mt-0.5 shrink-0 text-orange" />
                {item}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-primary mt-3 w-fit"
          >
            Começar
          </button>
        </div>

        {/* Espaço reservado para imagem */}
        <div className="relative hidden w-2/5 shrink-0 bg-gradient-to-br from-orange to-orange/60 sm:block">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 text-white/80 transition-colors hover:text-white"
          >
            <MdClose size={18} />
          </button>
          <img
            src="/images/welcome-illustration.png"
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
}
