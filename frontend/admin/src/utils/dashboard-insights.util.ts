import type { Company } from '@/models/company.model';
import { APPROVED_COLUMN_ID } from '@/models/operational-kanban.model';
import type { Task } from '@/models/task.model';

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface AttentionTask {
  task: Task;
  company?: Company;
}

export function getMyAttentionTasks(
  tasks: Task[],
  companies: Company[],
  uid: string,
  now = Date.now(),
): AttentionTask[] {
  const companyMap = Object.fromEntries(companies.map((c) => [c.companyId, c]));
  const todayEnd = startOfDay(now) + DAY_MS;

  return tasks
    .filter(
      (t) =>
        (t.assignedTo.length === 0 || t.assignedTo.includes(uid)) &&
        t.status !== APPROVED_COLUMN_ID &&
        t.dueDate < todayEnd,
    )
    .sort((a, b) => a.dueDate - b.dueDate)
    .map((task) => ({ task, company: companyMap[task.companyId] }));
}

export interface StaleCompany {
  company: Company;
  lastActivityAt: number;
  daysSince: number;
}

export function getStaleCompanies(
  companies: Company[],
  tasks: Task[],
  thresholdDays = 7,
  now = Date.now(),
): StaleCompany[] {
  const lastActivityByCompany = new Map<string, number>();
  for (const t of tasks) {
    const activity = Math.max(t.createdAt, t.updatedAt);
    const current = lastActivityByCompany.get(t.companyId) ?? 0;
    if (activity > current) {
      lastActivityByCompany.set(t.companyId, activity);
    }
  }

  const thresholdMs = thresholdDays * DAY_MS;

  return companies
    .filter((c) => c.companyStage === 'operacional')
    .map((company) => {
      const lastActivityAt = Math.max(
        company.createdAt,
        lastActivityByCompany.get(company.companyId) ?? 0,
      );
      return {
        company,
        lastActivityAt,
        daysSince: Math.floor((now - lastActivityAt) / DAY_MS),
      };
    })
    .filter((c) => now - c.lastActivityAt > thresholdMs)
    .sort((a, b) => a.lastActivityAt - b.lastActivityAt);
}
