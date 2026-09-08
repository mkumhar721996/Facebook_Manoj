function error(message, context = {}) {
  console.error(JSON.stringify({ level: "error", message, ...context }));
}

function warn(message, context = {}) {
  console.warn(JSON.stringify({ level: "warn", message, ...context }));
}

module.exports = { error, warn };
