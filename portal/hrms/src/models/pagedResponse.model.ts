// A list endpoint's answer when it returns one page at a time (e.g. GET /tasks).
export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
