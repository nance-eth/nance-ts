import pinataSDK from '@pinata/sdk';
import fs, { write } from 'fs';
import path from 'path';
import logger from '../logging';
import { PinataKey, Proposal } from '../types';

const TMP_DIR = path.join(__dirname, 'tmp');

export class PinataHandler {
  private pinata;

  constructor(
    private pinataKey: PinataKey
  ) {
    this.pinata = pinataSDK(pinataKey.KEY, pinataKey.SECRET);
    this.pinata.testAuthentication().then((response) => {
      logger.info(`pinataSDK auth: ${response.authenticated}`);
    }).catch(() => {
      logger.error('pinataSDK auth failed!');
    });
  }

  async pinProposal(proposal: Proposal): Promise<string> {
    const fileName = path.join(TMP_DIR, `${proposal.hash}.md`);
    fs.writeFileSync(fileName, proposal.markdown);
    return this.pinata.pinFromFS(fileName).then(async (response) => {
      fs.rm(fileName, () => {});
      return response.IpfsHash;
    });
  }
}
