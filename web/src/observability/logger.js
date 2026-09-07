/**
 * @typedef {Record<string, unknown>} LogFields
 */

/**
 * @param {"info" | "error"} level
 * @param {string} message
 * @param {LogFields} fields
 */
function write(level, message, fields) {
  const entry = JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...fields });
  if (level === "error") {
    console.error(entry);
  } else {
    console.log(entry);
  }
}

/**
 * @param {string} message
 * @param {LogFields} [fields]
 */
export function logInfo(message, fields = {}) {
  write("info", message, fields);
}

/**
 * @param {string} message
 * @param {LogFields} [fields]
 */
export function logError(message, fields = {}) {
  write("error", message, fields);
}
