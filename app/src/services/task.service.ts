import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { functions, storage } from '@/utils/firebase.util';
import type { Task, SaveTaskDTO } from '@/models/task.model';

export default class TaskService {
  private static listCallable = httpsCallable<void, Task[]>(
    functions,
    'listTasksHandler',
  );

  private static getCallable = httpsCallable<{ taskId: string }, Task>(
    functions,
    'getTaskHandler',
  );

  private static saveCallable = httpsCallable<SaveTaskDTO, Task>(
    functions,
    'saveTaskHandler',
  );

  private static updateStatusCallable = httpsCallable<
    { taskId: string; status: string },
    boolean
  >(functions, 'updateTaskStatusHandler');

  private static deleteCallable = httpsCallable<{ taskId: string }, boolean>(
    functions,
    'deleteTaskHandler',
  );

  static async listTasks(): Promise<Task[]> {
    const r = await this.listCallable();
    return r.data;
  }

  static async getTask(taskId: string): Promise<Task> {
    const r = await this.getCallable({ taskId });
    return r.data;
  }

  static async saveTask(data: SaveTaskDTO): Promise<Task> {
    const r = await this.saveCallable(data);
    return r.data;
  }

  static async updateTaskStatus(taskId: string, status: string): Promise<void> {
    await this.updateStatusCallable({ taskId, status });
  }

  static async deleteTask(taskId: string): Promise<void> {
    await this.deleteCallable({ taskId });
  }

  static async uploadImage(
    companyId: string,
    taskId: string,
    file: File,
  ): Promise<string> {
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storageRef = ref(
      storage,
      `client/${companyId}/tasks/${taskId}/images/${filename}`,
    );
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }
}
