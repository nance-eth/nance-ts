/* eslint-disable quote-props */
/* eslint-disable @typescript-eslint/quotes */
import { formatCustomTransaction } from '../voteSetup';

console.log(formatCustomTransaction({
  "args": [
    "1",
    "0x25910143C255828F623786f46fe9A8941B7983bB",
    "1"
  ],
  "value": "0",
  "contract": "0xD8b620f833b93624111e169855775e3403e9a65A",
  "tenderlyId": "",
  "functionName": "function burn(uint256 _projectId, address _account, uint256 _amount)"
}));
