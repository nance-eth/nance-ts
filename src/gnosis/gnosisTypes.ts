export type SubTransaction = {
  to: string;
  value: string;
  data?: string | null;
  operation: 0 | 1;
  gasToken?: string | null;
};

export type SafeEstimateResponse = {
  safeTxGas: string;
  baseGas: string;
  dataGas: string
  operationalGas: string;
  gasPrice: string;
  lastUsedNonce: string | null,
  gasToken: string;
  refundReceiver: string;
};

export type SafeMultisigTransaction = {
  safe: string;
  to: string,
  value: number;
  data?: string;
  operation: 0 | 1;
  gasToken?: string;
  safeTxGas: number;
  baseGas: number;
  gasPrice: number;
  refundReceiver?: string;
  nonce: number;
  contractTransactionHash?: string;
  sender?: string;
  signature?: string;
  origin?: string;
};
