import {
  MdOutlineBusiness,
  MdOutlineBarChart,
  MdOutlineLocationOn,
  MdOutlineWifi,
  MdOutlineNotes,
  MdOutlineCalendarToday,
} from 'react-icons/md';

import { formatCNPJ } from '@/formatters/formatCnpj';
import { formatPhone } from '@/formatters/formatPhone';

import type {
  Company,
  RevenueRange,
  BusinessSector,
} from '@/models/company.model';

const SECTOR_LABELS: Record<BusinessSector, string> = {
  imobiliaria: 'Imobiliária',
  construtora: 'Construtora',
  incorporadora: 'Incorporadora',
  corretor_autonomo: 'Corretor Autônomo',
  outro: 'Outro',
};

const REVENUE_LABELS: Record<RevenueRange, string> = {
  UpTo500K: 'Até R$ 500K',
  From500KTo2M: 'R$ 500K a R$ 2M',
  From2MTo5M: 'R$ 2M a R$ 5M',
  From5MTo10M: 'R$ 5M a R$ 10M',
  From10MTo30M: 'R$ 10M a R$ 30M',
  From30MTo100M: 'R$ 30M a R$ 100M',
  Above100M: 'Acima de R$ 100M',
};

const STAGE_LABELS: Record<string, string> = {
  comercial: 'Comercial',
  operacional: 'Operacional',
};

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

type FieldValue = string | number | undefined | null;

function InfoCell({ label, value }: { label: string; value: FieldValue }) {
  const isEmpty = value === undefined || value === null || value === '';
  return (
    <div className="flex items-center justify-between gap-6 px-5 py-3.5">
      <span className="shrink-0 text-[12px] text-text-muted">{label}</span>
      <span
        className={[
          'text-right text-[13px] font-medium',
          isEmpty ? 'text-text-muted/40' : 'text-text',
        ].join(' ')}
      >
        {isEmpty ? '—' : value}
      </span>
    </div>
  );
}

function InfoRow({
  left,
  right,
}: {
  left: [string, FieldValue];
  right?: [string, FieldValue] | null;
}) {
  return (
    <div className="grid grid-cols-2 divide-x divide-border">
      <InfoCell label={left[0]} value={left[1]} />
      {right != null ? <InfoCell label={right[0]} value={right[1]} /> : <div />}
    </div>
  );
}

function InfoSection({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Icon size={15} className="text-orange" />
        <p className="text-[13px] font-bold text-text">{title}</p>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

type Props = { company: Company };

export function ClientInfoTab({ company }: Props) {
  const { legalInformation, business, location, social, extra, contact } =
    company;

  const cnpj = formatCNPJ(legalInformation.documentNumber.replace(/\D/g, ''));
  const fullAddress = [
    `${location.address}, ${location.number}`,
    location.complement,
  ]
    .filter(Boolean)
    .join(' – ');

  return (
    <div className="space-y-4">
      {/* Empresa */}
      <InfoSection icon={MdOutlineBusiness} title="Empresa">
        <InfoRow
          left={['Nome de exibição', company.displayName]}
          right={['Razão social', legalInformation.legalName]}
        />
        <InfoRow
          left={['Nome fantasia', legalInformation.tradeName]}
          right={['CNPJ', cnpj]}
        />
        <InfoRow
          left={['E-mail', contact?.email]}
          right={[
            'Telefone',
            contact?.phone ? formatPhone(contact.phone) : undefined,
          ]}
        />
        <InfoRow
          left={['Estágio', STAGE_LABELS[company.companyStage]]}
          right={null}
        />
      </InfoSection>

      {/* Mercado */}
      <InfoSection icon={MdOutlineBarChart} title="Mercado">
        <InfoRow
          left={['Setor de atuação', SECTOR_LABELS[business.businessSector]]}
          right={[
            'Segmento personalizado',
            business.businessSector === 'outro'
              ? business.customSegment
              : undefined,
          ]}
        />
        <InfoRow
          left={['CNAE', business.cnae]}
          right={[
            'Faixa de faturamento',
            business.revenueRange
              ? REVENUE_LABELS[business.revenueRange]
              : undefined,
          ]}
        />
        <InfoRow
          left={['Nº de funcionários', business.quantityOfEmployees]}
          right={['Nº de corretores', business.quantityOfBrokers]}
        />
      </InfoSection>

      {/* Localização */}
      <InfoSection icon={MdOutlineLocationOn} title="Localização">
        <InfoRow
          left={['Endereço', fullAddress]}
          right={['Cidade / Estado', `${location.city} / ${location.state}`]}
        />
        <InfoRow
          left={['Bairro', location.neighborhood]}
          right={['CEP', location.zipCode]}
        />
      </InfoSection>

      {/* Redes sociais */}
      {social && (
        <InfoSection icon={MdOutlineWifi} title="Redes sociais">
          <InfoRow
            left={['Site', social.websiteUrl]}
            right={['Instagram', social.instagramUsername]}
          />
          <InfoRow left={['LinkedIn', social.linkedInUsername]} right={null} />
        </InfoSection>
      )}

      {/* Observações */}
      {extra?.observations && (
        <InfoSection icon={MdOutlineNotes} title="Observações">
          <div className="px-5 py-4 text-[13px] leading-relaxed text-text">
            {extra.observations}
          </div>
        </InfoSection>
      )}

      {/* Registro */}
      <InfoSection icon={MdOutlineCalendarToday} title="Registro">
        <InfoRow
          left={['Cadastrado em', formatDate(company.createdAt)]}
          right={['Atualizado em', formatDate(company.updatedAt)]}
        />
      </InfoSection>
    </div>
  );
}
