/**
 * @typedef {Record<string, string | number>} MetricLabels
 */

/**
 * @param {string} name
 * @param {MetricLabels} labels
 * @returns {string}
 */
function labelledKey(name, labels) {
  const labelPart = Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join(",");
  return labelPart ? `${name}{${labelPart}}` : name;
}

const counters = new Map();

/**
 * @param {string} name
 * @param {MetricLabels} [labels]
 */
export function incrementCounter(name, labels = {}) {
  const key = labelledKey(name, labels);
  counters.set(key, (counters.get(key) ?? 0) + 1);
}

/**
 * @param {string} name
 * @param {MetricLabels} [labels]
 * @returns {number}
 */
export function getCounter(name, labels = {}) {
  return counters.get(labelledKey(name, labels)) ?? 0;
}

export function resetMetrics() {
  counters.clear();
}
