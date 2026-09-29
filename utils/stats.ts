import type { BarDatum } from '@/components/charts/bar-chart';
import type { BusinessStats } from '@/services';

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function key(d: Date, byMonth: boolean): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return byMonth ? `${y}-${m}` : `${y}-${m}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * La API solo devuelve los días (o meses) con visitas; aquí se completa el rango con ceros
 * para que el gráfico muestre huecos reales.
 */
export function visitsSeries(stats: BusinessStats): BarDatum[] {
  const byMonth = stats.period === 'year';
  const values = new Map(stats.series.map((p) => [p.date.slice(0, byMonth ? 7 : 10), p]));
  const start = new Date(stats.start);
  const end = new Date(stats.end);
  const cursor = byMonth ? new Date(start.getFullYear(), start.getMonth(), 1) : new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const out: BarDatum[] = [];

  while (cursor <= end) {
    const point = values.get(key(cursor, byMonth));
    const visits = point?.visits ?? 0;
    const clients = point?.clients ?? 0;
    const label = byMonth
      ? MONTHS[cursor.getMonth()]
      : stats.period === 'week'
        ? DAYS[cursor.getDay()]
        : String(cursor.getDate());
    const detail = byMonth
      ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()} · ${clients} clientes`
      : `${DAYS[cursor.getDay()]} ${cursor.getDate()} ${MONTHS[cursor.getMonth()]} · ${clients} clientes`;
    out.push({ label, value: visits, detail });
    if (byMonth) cursor.setMonth(cursor.getMonth() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/** Distribución por hora; se recorta a las horas con actividad (o 7:00-22:00 si no hay). */
export function hoursSeries(stats: BusinessStats): BarDatum[] {
  const active = stats.by_hour.filter((h) => h.visits > 0).map((h) => h.hour);
  const from = active.length ? Math.min(...active) : 7;
  const to = active.length ? Math.max(...active) : 22;
  return stats.by_hour
    .filter((h) => h.hour >= from && h.hour <= to)
    .map((h) => ({ label: `${h.hour}h`, value: h.visits, detail: `${h.hour}:00 - ${h.hour + 1}:00` }));
}

export function peakHour(stats: BusinessStats): string | null {
  const best = stats.by_hour.reduce((a, b) => (b.visits > a.visits ? b : a), { hour: -1, visits: 0 });
  return best.visits ? `${best.hour}:00` : null;
}
