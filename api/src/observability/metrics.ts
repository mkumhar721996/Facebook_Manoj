export type MetricLabels = Record<string, string | number>;

function labelledKey(name: string, labels: MetricLabels): string {
  const labelPart = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
  return labelPart ? `${name}{${labelPart}}` : name;
}

const counters = new Map<string, number>();
const durations = new Map<string, number[]>();

export function incrementCounter(name: string, labels: MetricLabels = {}): void {
  const key = labelledKey(name, labels);
  counters.set(key, (counters.get(key) ?? 0) + 1);
}

export function getCounter(name: string, labels: MetricLabels = {}): number {
  return counters.get(labelledKey(name, labels)) ?? 0;
}

export function recordDuration(name: string, durationMs: number, labels: MetricLabels = {}): void {
  const key = labelledKey(name, labels);
  const samples = durations.get(key) ?? [];
  samples.push(durationMs);
  durations.set(key, samples);
}

export function getDurations(name: string, labels: MetricLabels = {}): number[] {
  return durations.get(labelledKey(name, labels)) ?? [];
}

export function resetMetrics(): void {
  counters.clear();
  durations.clear();
}
