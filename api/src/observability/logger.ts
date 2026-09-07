export type LogFields = Record<string, unknown>;

function write(stream: NodeJS.WritableStream, level: "info" | "error", message: string, fields: LogFields): void {
  stream.write(`${JSON.stringify({ level, message, timestamp: new Date().toISOString(), ...fields })}\n`);
}

export function logInfo(message: string, fields: LogFields = {}): void {
  write(process.stdout, "info", message, fields);
}

export function logError(message: string, fields: LogFields = {}): void {
  write(process.stderr, "error", message, fields);
}
