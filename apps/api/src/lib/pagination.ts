export interface PaginationInput {
  page: number
  limit: number
  skip: number
}

export function getPagination(pageInput: string | undefined, limitInput: string | undefined): PaginationInput {
  const page = Math.max(Number.parseInt(pageInput ?? '1', 10) || 1, 1)
  const requestedLimit = Math.max(Number.parseInt(limitInput ?? '25', 10) || 25, 1)
  const limit = Math.min(requestedLimit, 100)

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  }
}

export function getPaginationMeta(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  }
}
