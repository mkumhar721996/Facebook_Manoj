export type VNode = {
  tag: string;
  props: Readonly<Record<string, string>>;
  children: readonly (VNode | string)[];
};

export function h(
  tag: string,
  props: Readonly<Record<string, string>> = {},
  children: readonly (VNode | string)[] = [],
): VNode {
  return { tag, props, children };
}

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char] ?? char);
}

export function renderToStaticMarkup(node: VNode): string {
  const attrs = Object.entries(node.props)
    .map(([name, value]) => ` ${name}="${escapeHtml(value)}"`)
    .join("");

  const inner = node.children
    .map((child) => (typeof child === "string" ? escapeHtml(child) : renderToStaticMarkup(child)))
    .join("");

  return `<${node.tag}${attrs}>${inner}</${node.tag}>`;
}

export function findAll(node: VNode, predicate: (node: VNode) => boolean): VNode[] {
  const matches: VNode[] = predicate(node) ? [node] : [];
  for (const child of node.children) {
    if (typeof child !== "string") {
      matches.push(...findAll(child, predicate));
    }
  }
  return matches;
}

export function textContent(node: VNode): string {
  return node.children
    .map((child) => (typeof child === "string" ? child : textContent(child)))
    .join("");
}
