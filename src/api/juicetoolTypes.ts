export type ProposalType = 'Payout' | 'ReservedToken' | 'ParameterUpdate' | 'ProcessUpdate' | 'CustomTransaction';

export const juicetoolToNotion = {
  Payout: 'Payout',
  ReservedToken: 'Reserved JBX Allocation',
  ParameterUpdate: 'Funding Cycle Reconfiguration',
  ProcessUpdate: 'Process Upgrades',
  CustomTransaction: 'Other'
};
