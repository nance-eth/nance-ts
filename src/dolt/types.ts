export type WriteResponse = {
  query_execution_status: string;
  query_execution_message: string;
  repository_owner: string;
  repository_name: string;
  to_branch_name: string;
  from_branch_name: string;
  query: string;
  operation_name: string;
};

export type ReadResponse = {
  query_execution_status: string;
  query_execution_message: string,
  repository_owner: string,
  repository_name: string,
  commit_ref: string,
  sql_query: string,
  schema: any[],
  rows: any[]
};
