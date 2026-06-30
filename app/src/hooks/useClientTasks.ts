import { useState, useEffect, useCallback, useRef } from 'react';

import { useHandleError } from '@/hooks/useHandleError.util';
import TaskService from '@/services/task.service';
import type { Task, TaskUsage } from '@/models/task.model';

export function useClientTasks(companyId?: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [usage, setUsage] = useState<TaskUsage>({ used: 0, limit: null, yearMonth: '' });
  const [isLoading, setIsLoading] = useState(true);
  const handleError = useHandleError();
  const handleErrorRef = useRef(handleError);
  handleErrorRef.current = handleError;

  const load = useCallback(() => {
    setIsLoading(true);
    TaskService.listClientTasks(companyId)
      .then(({ tasks: fetchedTasks, usage: fetchedUsage }) => {
        setTasks(fetchedTasks);
        setUsage(fetchedUsage);
      })
      .catch((err) => handleErrorRef.current(err))
      .finally(() => setIsLoading(false));
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  const addTask = (task: Task) => {
    setTasks((prev) => [...prev, task]);
    setUsage((prev) => ({ ...prev, used: prev.used + 1 }));
  };

  return { tasks, usage, isLoading, refresh: load, addTask };
}
