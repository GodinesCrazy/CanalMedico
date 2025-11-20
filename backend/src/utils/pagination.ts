import { PaginatedResponse } from '@/types';

export const getPaginationParams = (page?: number, limit?: number): { skip: number; take: number } => {
  const defaultPage = 1;
  const defaultLimit = 10;
  const maxLimit = 100;

  const currentPage = page && page > 0 ? page : defaultPage;
  const currentLimit = limit && limit > 0 ? Math.min(limit, maxLimit) : defaultLimit;

  return {
    skip: (currentPage - 1) * currentLimit,
    take: currentLimit,
  };
};

export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

