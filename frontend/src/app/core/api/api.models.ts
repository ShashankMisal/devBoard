export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  success: true;
}

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ApiFieldError[];
  stack?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalDocs: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type AppApiErrorKind = 'validation' | 'auth' | 'forbidden' | 'not-found' | 'network' | 'server' | 'unknown';

export interface AppApiError {
  message: string;
  status?: number;
  kind: AppApiErrorKind;
  fields: Record<string, string>;
}
