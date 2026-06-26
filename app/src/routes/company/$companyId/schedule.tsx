import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

import { Spinner } from '@/components/ui/spinner.component';
import { CompanyScheduleCalendar } from '@/components/company/schedule/calendar.component';
import { useClientTasks } from '@/hooks/useClientTasks';
import { useCalendarTasks } from '@/hooks/useCalendarTasks';

export const Route = createFileRoute('/company/$companyId/schedule')({
  component: CompanySchedule,
});

function CompanySchedule() {
  const { companyId } = Route.useParams();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const { usage } = useClientTasks(companyId);
  const { tasks, isLoading, addTask } = useCalendarTasks(companyId, year, month);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Page header */}
      <div className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-bold text-text sm:text-[20px]">Cronograma</h1>
            <p className="mt-0.5 text-[12px] text-text-sub">
              Acompanhe e solicite tarefas para o seu calendário de publicações.
            </p>
          </div>

          {usage.limit !== null && (
            <div className="hidden shrink-0 flex-col items-end sm:flex">
              <span className="text-[11px] font-bold text-text-sub">
                {usage.used} / {usage.limit} tarefas este mês
              </span>
              <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-orange transition-all"
                  style={{ width: `${Math.min((usage.used / usage.limit) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Spinner className="text-orange" />
        </div>
      ) : (
        <CompanyScheduleCalendar
          tasks={tasks}
          year={year}
          month={month}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onTaskCreated={addTask}
        />
      )}
    </div>
  );
}
