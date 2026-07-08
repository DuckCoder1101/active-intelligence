import {Timestamp} from "firebase-admin/firestore";

export type NotificationType = "new-client-task";

export interface NotificationDocument {
  // uids dos usuários alvo desta notificação que ainda não a leram (admins
  // com a permissão relevante + destinatários da tarefa, quando houver). Ler
  // a notificação remove o uid daqui; quando a lista esvazia, o documento é
  // excluído.
  targetUids: string[];
  type: NotificationType;
  message: string;
  taskId?: string;
  companyId?: string;

  createdAt: Timestamp;
}
