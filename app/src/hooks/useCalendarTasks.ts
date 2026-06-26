import { useState, useEffect, useCallback, useRef } from 'react';

import TaskService from '@/services/task.service';
import { useHandleError } from '@/hooks/useHandleError.util';
import type { Task } from '@/models/task.model';

interface UseCalendarTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  addTask: (task: Task) => void;
}

export function useCalendarTasks(
  companyId: string | undefined,
  year: number,
  month: number,
): UseCalendarTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const handleError = useHandleError();
  const handleErrorRef = useRef(handleError);
  handleErrorRef.current = handleError;

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await TaskService.listCalendarTasks(year, month, companyId);
      setTasks(fetched);
    } catch (err) {
      handleErrorRef.current(err);
    } finally {
      setIsLoading(false);
    }
  }, [year, month, companyId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const addTask = useCallback((task: Task) => {
    setTasks((prev) => [...prev, task]);
  }, []);

  return { tasks, isLoading, addTask };
}
