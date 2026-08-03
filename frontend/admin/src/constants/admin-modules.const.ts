import {
  MdOutlinePeople,
  MdOutlineViewKanban,
  MdOutlineDescription,
  MdOutlineAssignment,
  MdOutlineFactCheck,
  MdOutlineAutoAwesome,
  MdOutlineCreditCard,
  MdOutlinePsychology,
  MdOutlineApps,
  MdOutlineLibraryBooks,
  MdOutlineReviews,
  MdOutlineSettings,
  MdOutlineGroup,
} from 'react-icons/md';

import type { Section } from '@/types/admin-module.type';

export const ADMIN_MODULES: Section[] = [
  {
    label: 'Operação',
    description: 'O dia a dia da equipe.',
    modules: [
      {
        icon: MdOutlinePeople,
        label: 'Clientes',
        description: 'Base completa de cada cliente.',
        to: '/companies',
        permission: 'manage-clients',
      },
      {
        icon: MdOutlineViewKanban,
        label: 'Workspace',
        description:
          'Central de operação por cliente: tarefas, prazos e cronograma.',
        to: '/workspace',
        permission: 'manage-projects',
      },
    ],
  },
  {
    label: 'Pré-projeto',
    description: 'O que vem antes do contrato.',
    modules: [
      {
        icon: MdOutlineDescription,
        label: 'Propostas',
        description: 'Combos e propostas em PDF.',
        to: 'https://activeops.lovable.app/pre-projeto/propostas',
        soon: true,
        permission: 'manage-proposals',
      },
      {
        icon: MdOutlineAssignment,
        label: 'Contratos',
        description: 'Contratos gerados com IA.',
        to: 'https://activeops.lovable.app/pre-projeto/contratos',
        soon: true,
        permission: 'manage-contracts',
      },
      {
        icon: MdOutlineFactCheck,
        label: 'Diagnósticos',
        description: 'Briefings com análise por IA.',
        to: 'https://activeops.lovable.app/pre-projeto/diagnosticos',
        soon: true,
        permission: 'manage-diagnostics',
      },
    ],
  },
  {
    label: 'Criação & Financeiro',
    description: 'Criação e controle financeiro.',
    modules: [
      {
        icon: MdOutlineAutoAwesome,
        label: 'Criação',
        description: 'Pipeline criativo e criativos com IA.',
        soon: true,
        permission: 'manage-creation',
      },
      {
        icon: MdOutlineCreditCard,
        label: 'Financeiro',
        description: 'Recebíveis, MRR, TCV e mídia.',
        to: '/finances',
        permission: 'manage-finance',
      },
    ],
  },
  {
    label: 'Inteligência & Planos',
    description: 'Dados cruzados e produtos.',
    modules: [
      {
        icon: MdOutlinePsychology,
        label: 'Inteligência',
        description: 'Benchmarks e dashboards consolidados.',
        soon: true,
        permission: 'manage-intelligence',
      },
      {
        icon: MdOutlineApps,
        label: 'Planos',
        description: 'Produtos, planos e playbooks.',
        to: '/plans',
        permission: 'manage-plans',
      },
      {
        icon: MdOutlineLibraryBooks,
        label: 'Biblioteca',
        description: 'Guias de conteúdo, playbooks e materiais.',
        to: '/library',
        permission: 'manage-library',
      },
      {
        icon: MdOutlineReviews,
        label: 'Avaliações',
        description: 'Feedback semanal das empresas clientes.',
        to: '/reviews',
        permission: 'manage-reviews',
      },
    ],
  },
  {
    label: 'Administração',
    description: 'Configuração e equipe.',
    modules: [
      {
        icon: MdOutlineGroup,
        label: 'Administradores',
        description: 'Gestão de administradores e permissões.',
        to: '/team',
        permission: 'manage-team',
      },
      {
        icon: MdOutlineSettings,
        label: 'Configurações',
        description: 'Personalização do painel.',
        to: '/settings',
        permission: 'manage-settings',
      },
    ],
  },
];
