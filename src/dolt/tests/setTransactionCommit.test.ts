import { DoltSysHandler } from '../doltSysHandler';
import { pools } from '../pools';

const doltSys = new DoltSysHandler(pools.nance_sys);

export const setTransactionCommit = async () => {
  try {
    await doltSys.setTransactionCommit();
  } catch (e) {
    console.log('error setting transaction commit', e);
  }
};

setTransactionCommit();
