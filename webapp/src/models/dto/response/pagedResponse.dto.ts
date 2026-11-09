export type PagedResponseDto<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
