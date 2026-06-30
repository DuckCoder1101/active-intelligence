export interface CompleteAccountDTO {
  name: string;
  phone: string;
  cpf: string;
}

export interface UpdateAccountDTO {
  targetId: string;
  name?: string;
  phone?: string;
}

export interface DeleteAccountDTO {
  targetId: string;
}
