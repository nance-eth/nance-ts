import { getDb, getSysDb, initializePools } from '../dolt/pools';
import { oneLine } from "common-tags";

const QUERY = oneLine`
  DELETE FROM dolt_ignore WHERE pattern = 'private_%';
`;

async function main() {
  await initializePools();
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
