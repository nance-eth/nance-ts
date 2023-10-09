import { DoltSysHandler } from './doltSysHandler';
import { pools } from './pools';

export const doltSys = new DoltSysHandler(pools.nance_sys);
