import { PaginationOrder } from '@common/dto/pagination.dto';

export interface IPagination {
  page?: number; // Page number (1-based)
  limit?: number; // Number of items per page
  search?: string; // Search term
  sortBy?: string; // Field to sort by
  order?: PaginationOrder; // Sort order (asc/desc)
}
