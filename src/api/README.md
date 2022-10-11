# nance-api

## Examples

`ts-node src/api/exmaples/basic.ts`

query 
`https://nance-ts-staging.up.railway.app/juicebox`

success return
```
{
  "sucess": true,
  "data": {
    "name": "juicebox",
    "currentCycle": "33"
  }
}
```

error return
```
{
  "success":false,
  "error": "space juicebox2 not found!"
}
```

query 
`https://nance-ts-staging.up.railway.app/juicebox/query`

success return
```
{
  "sucess": true,
  "data": {
    [
      {
        "hash": "...",
        "title": "...",
        "url":"...",
        "type":"...",
        "status":"...",
        "proposalId":"...",
        "discussionThreadURL":"...",
        "ipfsURL":"...",
        "voteURL":"...",
        "date":"...",
        "governanceCycle":"...",
        "payout": {
          "address":"...",
          "amountUSD":"...",
          "count":"...",
          "treasuryVersion":"..."
        }
      },
    ...
    ]
  }
}
```

query 
`https://nance-ts-staging.up.railway.app/juicebox/markdown?hash=6bb92c83571245949ecf1e495793e66b`

success return
```
{
  "sucess": true,
  "data": {
    "hash": "...",
    "title": "...",
    "url":"...",
    "type":"...",
    "status":"...",
    "proposalId":"...",
    "discussionThreadURL":"...",
    "ipfsURL":"...",
    "voteURL":"...",
    "date":"...",
    "governanceCycle":"...",
    "payout": {
      "address":"...",
      "amountUSD":"...",
      "count":"...",
      "treasuryVersion":"..."
    }
  }
}
```