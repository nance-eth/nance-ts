import { oneLine } from 'common-tags';

export const SELECT_ACTIONS = oneLine`
SELECT proposals.*,
  CONCAT(
    '[',
    GROUP_CONCAT(
      JSON_UNQUOTE(
        JSON_OBJECT(
          'type', 'Payout',
          'uuid', payouts.uuidOfPayout,
          'payload', JSON_OBJECT(
            'amountUSD', payouts.amount,
            'governanceCycleStart', payouts.governanceCycleStart,
            'count', payouts.numberOfPayouts,
            'address', payouts.payAddress,
            'project', payouts.payProject
          )
        )
      )
      SEPARATOR ','
    ),
    ',',
    GROUP_CONCAT(
      JSON_UNQUOTE(
        JSON_OBJECT(
          'type', 'Transfer',
          'uuid', transfers.uuidOfTransfer,
          'payload', JSON_OBJECT(
            'contract', transfers.transferTokenAddress,
            'tokenName', transfers.transferTokenName,
            'to', transfers.transferAddress,
            'amount', transfers.transferAmount
          )
        )
      )
      SEPARATOR ','
    ),
    ',',
    GROUP_CONCAT(
      JSON_UNQUOTE(
        JSON_OBJECT(
          'type', 'Custom Transaction',
          'uuid', customTransactions.uuidOfTransaction,
          'payload', JSON_OBJECT(
            'contract', customTransactions.transactionAddress,
            'value', customTransactions.transactionValue,
            'functionName', customTransactions.transactionFunctionName,
            'args', customTransactions.transactionFunctionArgs
          )
        )
      )
      SEPARATOR ','
    ),
    ']'
  ) as actions
FROM proposals
LEFT JOIN payouts ON proposals.uuid = payouts.uuidOfProposal
LEFT JOIN transfers ON proposals.uuid = transfers.uuidOfProposal
LEFT JOIN customTransactions ON proposals.uuid = customTransactions.uuidOfProposal
`;
