import {
  MdOutlinePeople,
  MdOutlineViewKanban,
  MdOutlineHub,
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
        to: '/app/admin/clients',
      },
      {
        icon: MdOutlineViewKanban,
        label: 'Projetos',
        description: 'Board com tarefas, prazos e equipe.',
        soon: true,
      },
      {
        icon: MdOutlineHub,
        label: 'CRM Operacional',
        description: 'Saúde, riscos e upsell dos clientes.',
        soon: true,
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
        to: '/app/admin/proposals',
      },
      {
        icon: MdOutlineAssignment,
        label: 'Contratos',
        description: 'Contratos gerados com IA.',
        to: '/app/admin/contracts',
      },
      {
        icon: MdOutlineFactCheck,
        label: 'Diagnósticos',
        description: 'Briefings com análise por IA.',
        to: '/app/admin/diagnostics',
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
      },
      {
        icon: MdOutlineCreditCard,
        label: 'Financeiro',
        description: 'Recebíveis, MRR, TCV e mídia.',
        soon: true,
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
      },
      {
        icon: MdOutlineApps,
        label: 'Catálogo',
        description: 'Produtos, planos e playbooks.',
        to: '/app/admin/catalog',
      },
    ],
  },
  {
    label: 'Administração',
    description: 'Configuração e equipe.',
    modules: [
      {
        icon: MdOutlineGroup,
        label: 'Equipe',
        description: 'Gestão de membros e permissões.',
        to: '/app/admin/team',
      },
      {
        icon: MdOutlineSettings,
        label: 'Configurações',
        description: 'Personalização do painel.',
        to: '/app/admin/settings',
      },
    ],
  },
];
