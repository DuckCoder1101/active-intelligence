import { useState, useEffect, useCallback, useRef } from 'react';

import { useHandleError } from '@/hooks/useHandleError.util';
import TaskService from '@/services/task.service';
import type { Task } from '@/models/task.model';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const handleError = useHandleError();
  const handleErrorRef = useRef(handleError);
  handleErrorRef.current = handleError;

  const load = useCallback(() => {
    setIsLoading(true);
    TaskService.listTasks()
      .then(setTasks)
      .catch((err) => handleErrorRef.current(err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (taskId: string, status: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.taskId === taskId ? { ...t, status } : t)),
    );
    try {
      await TaskService.updateTaskStatus(taskId, status);
    } catch (err) {
      handleErrorRef.current(err);
      load();
    }
  };

  const upsertTask = (task: Task) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.taskId === task.taskId);
      return exists
        ? prev.map((t) => (t.taskId === task.taskId ? task : t))
        : [...prev, task];
    });
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.taskId !== taskId));
  };

  return {
    tasks,
    isLoading,
    refresh: load,
    updateStatus,
    upsertTask,
    removeTask,
  };
}
