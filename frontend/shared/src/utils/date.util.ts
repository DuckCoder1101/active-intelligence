export function toDateInput(ms?: number): string {
  return ms ? new Date(ms).toISOString().split('T')[0] : '';
}

export function fromDateInput(value: string): number {
  return new Date(`${value}T12:00:00`).getTime();
}

export function toMonthInput(ms?: number): string {
  return ms ? new Date(ms).toISOString().slice(0, 7) : '';
}

export function fromMonthInput(value: string): number {
  return new Date(`${value}-01T12:00:00`).getTime();
}

const MONTHS_PT_ABBR = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
];

/** Aceita "MM-AAAA", "MM/AAAA" ou mês escrito ("JAN 2026", "Janeiro/2026"). Retorna `null` se não reconhecer. */
export function parseCompetencia(text: string): number | null {
  const raw = text.trim();
  if (!raw) {
    return null;
  }

  let month: number | null = null;
  let year: number | null = null;

  const numeric = raw.match(/^(\d{1,2})[\s/-]+(\d{4})$/);
  if (numeric) {
    month = Number(numeric[1]);
    year = Number(numeric[2]);
  } else {
    const written = raw.match(/^([A-Za-zÀ-ú]{3,})[\s/-]*(\d{4})$/);
    if (written) {
      const prefix = written[1].slice(0, 3).toUpperCase();
      const monthIndex = MONTHS_PT_ABBR.indexOf(prefix);
      if (monthIndex !== -1) {
        month = monthIndex + 1;
        year = Number(written[2]);
      }
    }
  }

  if (!month || !year || month < 1 || month > 12) {
    return null;
  }

  return new Date(year, month - 1, 1, 12).getTime();
}

/** "JAN 2026" */
export function formatCompetencia(ms: number): string {
  const d = new Date(ms);
  return `${MONTHS_PT_ABBR[d.getMonth()]} ${d.getFullYear()}`;
}
