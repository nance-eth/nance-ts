import { DoltSysHandler } from '../dolt/doltSysHandler';
import { DoltHandler } from '../dolt/doltHandler';
import { getDb, getSysDb, initializePools } from '../dolt/pools';
import { sleep } from "../utils";
import { oneLine } from "common-tags";

const QUERY = oneLine`
  ALTER TABLE proposals add column signature varchar(255);
`;

async function main() {
  initializePools;
  const doltSys = getSysDb();
  const spaces = await doltSys.getAllSpaceNames();
  spaces.forEach(async (config) => {
    const dolt = getDb(config.space);
    dolt.localDolt.db.query(QUERY).then((res) => {
      console.log(res);
    }).catch((err) => {
      console.error(err);
    });
  });
}

main();
