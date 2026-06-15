import { useSnackbar } from '@contexts/snackbar.context';
import { FirebaseError } from 'firebase/app';

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

export function useHandleError() {
  const { pushSnackbar } = useSnackbar();

  return function handleError(error: unknown): void {
    if (!(error instanceof FirebaseError)) {
      pushSnackbar({ message: 'Ocorreu um erro inesperado.', type: 'error' });
      return;
    }

    const [service, code] = error.code.split('/');
    if (service === 'functions') {
      if (code == 'internal') {
        pushSnackbar({
          message: 'Erro interno inesperado! Tente novamente mais tarde!',
          type: 'error',
        });
      } else {
        pushSnackbar({ message: error.message, type: 'error' });
      }
    } else if (service === 'auth') {
      pushSnackbar({
        message: AUTH_MESSAGES[code] ?? 'Erro de autenticação.',
        type: 'error',
      });
    } else if (service === 'storage') {
      pushSnackbar({
        message: STORAGE_MESSAGES[code] ?? 'Erro no armazenamento.',
        type: 'error',
      });
    } else {
      pushSnackbar({ message: 'Ocorreu um erro inesperado.', type: 'error' });
    }
  };
}
