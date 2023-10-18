# nance-api

## Examples

basic typescript example:

`ts-node src/api/exmaples/basic.ts`

**GET** 
https://nance-ts-staging.up.railway.app/juicebox

success return
```
{
  "success": true,
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

**GET**
https://nance-ts-staging.up.railway.app/juicebox/query

success return
```
{
  "success": true,
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

**GET**
https://nance-ts-staging.up.railway.app/juicebox/markdown?hash=6bb92c83571245949ecf1e495793e66b

success return
```
{
  "success": true,
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

**POST**
https://nance-ts-staging.up.railway.app/juicebox/upload, proposal: Proposal

success return
```
{
  "success": true,
  "data": {
    "hash": "..."
  }
}
```
