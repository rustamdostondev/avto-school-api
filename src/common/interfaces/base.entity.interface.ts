export interface IBaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
  is_deleted?: boolean;
  deleted_at?: Date;
  deleted_by?: number;
}

export interface ISoftDelete {
  is_deleted: boolean;
  deleted_at: Date | null;
  deleted_by: number | null;
}

export interface IQueryOptions {
  includeDeleted?: boolean;
  trx?: any; // Knex transaction
}

export interface IPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
