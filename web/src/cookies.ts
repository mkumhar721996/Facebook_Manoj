export function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((pair) => {
      const [name, ...rest] = pair.trim().split("=");
      return [name, decodeURIComponent(rest.join("="))];
    })
  );
}
