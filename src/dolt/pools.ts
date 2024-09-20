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
  // console.log('loading pools...');
  spaces.forEach((space) => {
    // console.log(space.space);
    try {
      pools[space.space] = new DoltSQL(dbOptions(space.space));
    } catch (e) {
      console.log(`Error creating pool for ${space.space}`);
    }
  });
  pools.common = new DoltSQL(dbOptions('common'));
  return pools;
}

export async function closePools() {
  if (pools) {
    Object.keys(pools).forEach((key) => {
      pools[key].db.end();
    });
  }
}

fetchPools();
