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

export type PollResponse = {
  _id: string;
  done: boolean;
  res_details: {
    query_execution_status: string;
    query_execution_message: string;
    owner_name: string;
    repository_name: string;
    from_commit_id: string;
    to_commit_id: string;
  }
};

export type DoltReadOptions = {
  branch?: string;
  endpoint?: string;
  params?: Record<string, string>
};
