import { onSchedule } from "firebase-functions/scheduler";
import { bucket } from "functions-shared";
import { TaskRepository } from "../repositories/task.repository";

const DAYS_TO_EXPIRE = 31;
const MS_IN_DAY = 24 * 60 * 60 * 1000;

export const deleteOldTaskMedia = onSchedule(
  {
    schedule: "59 23 * * *",
    timeZone: "America/Sao_Paulo",
  },
  async () => {
    const now = Date.now();
    const tasks = await TaskRepository.listWithMedia();

    for (const task of tasks) {
      const age = now - task.createdAt;
      if (age < DAYS_TO_EXPIRE * MS_IN_DAY) continue;

      const prefix = `client/${task.companyId}/tasks/${task.taskId}/`;
      await bucket.deleteFiles({ prefix }).catch((_err) => {
        console.log("Erro ao deletar os arquivos da task: " + task.taskId);
      });
      await TaskRepository.clearMedia(task.taskId);
    }
  },
);
