/* eslint-disable quote-props */
/* eslint-disable @typescript-eslint/quotes */
import { actionsToMarkdown } from '../voteSetup';

actionsToMarkdown([
  {
    "type": "Custom Transaction",
    "uuid": "0a2dec2e6ba44015afe98408db80de17",
    "payload": {
      "args": [
        "1",
        "0x25910143C255828F623786f46fe9A8941B7983bB",
        "1"
      ],
      "value": "0",
      "contract": "0xD8b620f833b93624111e169855775e3403e9a65A",
      "tenderlyId": "",
      "functionName": "function burn(uint256 _projectId, address _account, uint256 _amount)"
    }
  },
  {
    "type": "Custom Transaction",
    "uuid": "faebbab780924fae955a7cee9124b0ca",
    "payload": {
      "args": [
        "1000",
        "0x25910143C255828F623786f46fe9A8941B7983bB"
      ],
      "value": "0",
      "contract": "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      "tenderlyId": "",
      "functionName": "function unwrapWETH9(uint256 amountMinimum, address recipient) payable"
    }
  }
]).then((res) => {
  console.log(res);
});
