import { NotionHandler } from '../notion/notionHandler';
import { NanceTreasury } from '../treasury';
import { getConfig } from '../configLoader';

async function main() {
  const config = await getConfig();
  const notion = new NotionHandler(config);
  const treasury = new NanceTreasury(config, notion);

  const p = await treasury.V1encodeReconfigureFundingCyclesOf();
  console.log(p.bytes);
}

main();
