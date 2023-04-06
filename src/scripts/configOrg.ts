import 'dotenv/config';
import fs from 'fs';
import { DoltSysHandler } from '../dolt/doltSysHandler';
import { dotPin } from '../storage/storageHandler';
import { nanceAddress } from '../keys';

const configPath = './src/config';

async function configOrg(org: string) {
  const dolt = new DoltSysHandler();
  const config = JSON.parse(fs.readFileSync(`${configPath}/${org}/${org}.json`, 'utf-8'));
  const calendar = fs.readFileSync(`${configPath}/${org}/${org}.ics`, 'utf-8');
  const packedConfig = JSON.stringify({ config, calendar });
  const cid = await dotPin(packedConfig);
  dolt.setSpaceConfig(org, cid, ['0x25910143C255828F623786f46fe9A8941B7983bB', nanceAddress], config, calendar).then((res) => {
    console.log(`[CREATE SPACE]: ${res}`);
  });
}

configOrg('juicebox');
