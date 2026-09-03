import type { Sort } from "../models/task.ts";
import { escapeHtml } from "./escapeHtml.ts";

function buildPageHref(page: number, sort: Sort): string {
  return escapeHtml(`?page=${page}&sortBy=${sort.sortBy}&order=${sort.order}`);
}

function renderLink(action: "prev" | "next", label: string, page: number, sort: Sort, disabled: boolean): string {
  if (disabled) {
    return `<a data-action="${action}" disabled>${label}</a>`;
  }
  return `<a data-action="${action}" href="${buildPageHref(page, sort)}">${label}</a>`;
}

export function renderPagination(currentPage: number, totalPages: number, sort: Sort): string {
  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return `<nav>
    ${renderLink("prev", "Previous", currentPage - 1, sort, prevDisabled)}
    <span>Page ${currentPage} of ${totalPages}</span>
    ${renderLink("next", "Next", currentPage + 1, sort, nextDisabled)}
  </nav>`;
}
