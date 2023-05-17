SELECT proposals.uuid,
  CONCAT(
    '[',
    (
      SELECT JSON_ARRAYAGG(
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
      FROM payouts 
      WHERE proposals.uuid = payouts.uuidOfProposal AND payouts.uuidOfPayout IS NOT NULL
    ),
    ',',
    (
      SELECT JSON_ARRAYAGG(
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
      FROM transfers
      WHERE proposals.uuid = transfers.uuidOfProposal AND transfers.uuidOfTransfer IS NOT NULL
    ),
    ',',
    (
      SELECT JSON_ARRAYAGG(
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
      FROM customTransactions
      WHERE proposals.uuid = customTransactions.uuidOfProposal AND customTransactions.uuidOfTransaction IS NOT NULL
    ),
    ',',
    (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'type', 'Reserve',
          'uuid', reserves.uuidOfReserve,
          'payload', JSON_OBJECT(
            'splits', reserves.splits
          )
        )
      )
      FROM reserves
      WHERE proposals.uuid = reserves.uuidOfProposal AND reserves.uuidOfReserve IS NOT NULL
    ),
    ']'
  ) as actions
FROM proposals
WHERE governanceCycle=41 AND uuid = '7799fcb5d1664b829f447d41256347da';
