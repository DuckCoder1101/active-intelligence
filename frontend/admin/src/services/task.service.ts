import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import type { Task, SaveTaskDTO, CreateClientTaskDTO, TaskUsage } from '@/models/task.model';
import { functions, storage } from '@/utils/firebase.util';

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

  private static createClientTaskCallable = httpsCallable<CreateClientTaskDTO, Task>(
    functions,
    'createClientTaskHandler',
  );

  private static listClientTasksCallable = httpsCallable<{ companyId?: string }, { tasks: Task[]; usage: TaskUsage }>(
    functions,
    'listClientTasksHandler',
  );

  private static listCalendarTasksCallable = httpsCallable<
    { companyId?: string; year: number; month: number },
    { tasks: Task[] }
  >(functions, 'listCalendarTasksHandler');

  static async createClientTask(data: CreateClientTaskDTO): Promise<Task> {
    const r = await this.createClientTaskCallable(data);
    return r.data;
  }

  static async listClientTasks(companyId?: string): Promise<{ tasks: Task[]; usage: TaskUsage }> {
    const r = await this.listClientTasksCallable({ companyId });
    return r.data;
  }

  static async listCalendarTasks(year: number, month: number, companyId?: string): Promise<Task[]> {
    const r = await this.listCalendarTasksCallable({ year, month, companyId });
    return r.data.tasks;
  }

  private static updateClientTaskImagesCallable = httpsCallable<
    { taskId: string; referenceImages: string[] },
    { success: boolean }
  >(functions, 'updateClientTaskImagesHandler');

  static async updateClientTaskImages(taskId: string, referenceImages: string[]): Promise<void> {
    await this.updateClientTaskImagesCallable({ taskId, referenceImages });
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
