import path from "node:path";

/**
 * Resolves a requested (attacker-controlled) path against a base directory,
 * returning the resolved absolute path only if it stays within that
 * directory. Returns undefined if the requested path would escape it
 * (e.g. via "../" segments), regardless of how those segments arrived.
 */
export function resolveWithinBase(baseDir: string, requestedPath: string): string | undefined {
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, `.${path.sep}${requestedPath}`);

  if (resolvedTarget !== resolvedBase && !resolvedTarget.startsWith(resolvedBase + path.sep)) {
    return undefined;
  }

  return resolvedTarget;
}
