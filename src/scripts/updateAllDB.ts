import { DoltSysHandler } from '../dolt/doltSysHandler';
import { DoltHandler } from '../dolt/doltHandler';
import { pools } from '../dolt/pools';
import { sleep } from "../utils";
import { oneLine } from "common-tags";

const QUERY = oneLine`
  ALTER TABLE proposals add column signature varchar(255);
`;

async function main() {
  await sleep(2000);
  const doltSys = new DoltSysHandler(pools.nance_sys);
  const spaces = await doltSys.getAllSpaceNames();
  spaces.forEach(async (config) => {
    const dolt = new DoltHandler(pools[config.space], '');
    dolt.localDolt.db.query(QUERY).then((res) => {
      console.log(res);
    }).catch((err) => {
      console.error(err);
    });
  });
}

main();
