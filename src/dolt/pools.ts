/* eslint-disable import/no-mutable-exports */
/* eslint-disable prefer-const */
import 'dotenv/config';
import { dbOptions } from './dbConfig';
import { DoltSQL } from './doltSQL';
import { DoltSysHandler } from './doltSysHandler';

export let pools: Record<string, DoltSQL> = {};

export async function fetchPools() {
  const sysDolt = new DoltSQL(dbOptions('nance_sys'));
  const sys = new DoltSysHandler(sysDolt);
  pools.nance_sys = sysDolt;
  const spaces = await sys.getAllSpaceNames();
  spaces.forEach((space) => {
    pools[space.space] = new DoltSQL(dbOptions(space.space));
  });
  return pools;
}

fetchPools();
