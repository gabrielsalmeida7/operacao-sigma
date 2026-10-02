export interface DatabaseClient {
  select<T>(sql: string, bindValues?: unknown[]): Promise<T>;
  execute(sql: string, bindValues?: unknown[]): Promise<unknown>;
}
