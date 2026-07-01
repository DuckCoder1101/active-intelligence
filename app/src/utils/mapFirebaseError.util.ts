import { FirebaseError } from 'firebase/app';

import type { SnackbarMessage } from '@/contexts/snackbar.context';

const AUTH_MESSAGES: Record<string, string> = {
  'email-already-in-use': 'Este e-mail já está em uso.',
  'invalid-email': 'E-mail inválido.',
  'user-not-found': 'Usuário não encontrado.',
  'wrong-password': 'Senha incorreta.',
  'weak-password': 'A senha é muito fraca.',
  'user-disabled': 'Esta conta foi desativada.',
  'too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
  'network-request-failed': 'Erro de conexão. Verifique sua internet.',
  'requires-recent-login': 'Faça login novamente para continuar.',
  'invalid-credential': 'Credenciais inválidas.',
  'operation-not-allowed': 'Operação não permitida.',
  'popup-closed-by-user': 'Login cancelado.',
  'cancelled-popup-request': 'Login cancelado.',
  'account-exists-with-different-credential':
    'Já existe uma conta com este e-mail usando outro método de login.',
};

const STORAGE_MESSAGES: Record<string, string> = {
  'object-not-found': 'Arquivo não encontrado.',
  'bucket-not-found': 'Bucket de armazenamento não encontrado.',
  'quota-exceeded': 'Cota de armazenamento excedida.',
  unauthenticated: 'Faça login para acessar este arquivo.',
  unauthorized: 'Você não tem permissão para acessar este arquivo.',
  'retry-limit-exceeded': 'Tempo limite excedido. Tente novamente.',
  'invalid-checksum': 'Erro no arquivo enviado. Tente novamente.',
  canceled: 'Upload cancelado.',
  unknown: 'Erro desconhecido no armazenamento.',
};

export function mapFirebaseError(error: unknown): SnackbarMessage {
  if (!(error instanceof FirebaseError)) {
    console.error(`Erro inesperado: ${error?.toString() ?? error}`);
    return { message: 'Ocorreu um erro inesperado.', type: 'error' };
  }

  const [service, code] = error.code.split('/');

  if (service === 'functions') {
    console.error(`Erro no cloud functions: ${error.code} - ${error.message}`);
    return code === 'internal'
      ? {
          message: 'Erro interno inesperado! Tente novamente mais tarde!',
          type: 'error',
        }
      : { message: error.message, type: 'error' };
  }

  if (service === 'auth') {
    console.error(`Erro no cloud auth: ${error.code} - ${error.message}`);
    return {
      message: AUTH_MESSAGES[code] ?? 'Erro de autenticação.',
      type: 'error',
    };
  }

  if (service === 'storage') {
    console.error(`Erro no cloud storage: ${error.code} - ${error.message}`);
    return {
      message: STORAGE_MESSAGES[code] ?? 'Erro no armazenamento.',
      type: 'error',
    };
  }

  console.error(`Erro desconhecido: ${error.code} - ${error.message}`);
  return { message: 'Ocorreu um erro inesperado.', type: 'error' };
}
