export type SubTransaction = {
  to: string;
  value: string;
  data?: string | null;
  operation: 0 | 1;
  gasToken?: string | null;
};
