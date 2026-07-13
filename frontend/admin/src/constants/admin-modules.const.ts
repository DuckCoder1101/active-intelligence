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
        label: 'Tarefas',
        description: 'Board com tarefas, prazos e equipe.',
        to: '/projects',
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
        // to: '/proposals',
        permission: 'manage-proposals',
      },
      {
        icon: MdOutlineAssignment,
        label: 'Contratos',
        description: 'Contratos gerados com IA.',
        to: '/contracts',
        permission: 'manage-contracts',
      },
      {
        icon: MdOutlineFactCheck,
        label: 'Diagnósticos',
        description: 'Briefings com análise por IA.',
        to: '/diagnostics',
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
        to: '/finance',
        permission: 'manage-finance',
      },
    ],
  },
  {
    label: 'Inteligência & Catálogo',
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
        label: 'Catálogo',
        description: 'Produtos, planos e playbooks.',
        to: '/catalog',
        permission: 'manage-catalog',
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
