import type { AdminPermissionMeta } from '@/types/permissions.type';

export const ADMIN_PERMISSIONS_META: AdminPermissionMeta[] = [
  { key: 'manage-clients', label: 'Clientes', group: 'Operação' },
  { key: 'manage-projects', label: 'Projetos', group: 'Operação' },
  { key: 'manage-crm', label: 'CRM Operacional', group: 'Operação' },
  { key: 'manage-proposals', label: 'Propostas', group: 'Pré-projeto' },
  { key: 'manage-contracts', label: 'Contratos', group: 'Pré-projeto' },
  { key: 'manage-diagnostics', label: 'Diagnósticos', group: 'Pré-projeto' },
  { key: 'manage-creation', label: 'Criação', group: 'Criação & Financeiro' },
  { key: 'manage-finance', label: 'Financeiro', group: 'Criação & Financeiro' },
  {
    key: 'manage-intelligence',
    label: 'Inteligência',
    group: 'Inteligência & Planos',
  },
  {
    key: 'manage-plans',
    label: 'Planos',
    group: 'Inteligência & Planos',
  },
  {
    key: 'manage-library',
    label: 'Biblioteca',
    group: 'Inteligência & Planos',
  },
  {
    key: 'manage-reviews',
    label: 'Avaliações',
    group: 'Inteligência & Planos',
  },
  { key: 'manage-team', label: 'Administradores', group: 'Administração' },
  { key: 'manage-settings', label: 'Configurações', group: 'Administração' },
];
