export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const buildPagination = (page: number, limit: number, total: number): Pagination => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
});

export const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
