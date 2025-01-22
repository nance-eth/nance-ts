import "dotenv/config";
import { dbOptions } from "./dbConfig";
import { DoltSQL } from "./doltSQL";
import { DoltSysHandler } from "./doltSysHandler";
import { DoltHandler } from "./doltHandler";

type PoolMap = Map<string, DoltHandler>;

const createPoolManager = () => {
  const pools: PoolMap = new Map();
  let sys: DoltSysHandler | null = null;
  let initialized = false;

  const initialize = async (): Promise<void> => {
    console.log("[POOLS] initializing...");
    if (initialized) return;
    const sysDolt = new DoltSQL(dbOptions("nance_sys"));
    sys = new DoltSysHandler(sysDolt);

    const spaceConfigs = await sys.getAllSpaceConfig();
    spaceConfigs.forEach((config) => {
      try {
        const sql = new DoltSQL(dbOptions(config.space));
        pools.set(config.space, new DoltHandler(sql, config.config.proposalIdPrefix));
      } catch (e) {
        console.error(`Error creating pool for ${config.space}:`, e);
      }
    });
    const sql = new DoltSQL(dbOptions("common"));
    pools.set("common", new DoltHandler(sql));
    initialized = true;
    console.log("[POOLS] ready!");
  };

  const add = (space: string, proposalIdPrefix?: string): void => {
    if (!initialized) {
      throw new Error("Pools not initialized. Call initializePools() first.");
    }
    try {
      const sql = new DoltSQL(dbOptions(space));
      pools.set(space, new DoltHandler(sql, proposalIdPrefix));
      console.log(`[POOLS] Added new pool for space: ${space}`);
    } catch (e) {
      console.error(`Error adding pool for ${space}:`, e);
    }
  };

  const get = (key: string): DoltHandler => {
    if (!initialized) {
      throw new Error("Pools not initialized. Call initializePools() first.");
    }
    const pool = pools.get(key);
    if (!pool) {
      throw new Error(`space ${key} not found`);
    }
    return pool;
  };

  const getSys = (): DoltSysHandler => {
    if (!initialized || !sys) {
      throw new Error("Pools not initialized or sysHandler not available.");
    }
    return sys;
  };

  const close = async (): Promise<void> => {
    await Promise.all(Array.from(pools).map(async ([key, pool]) => {
      await pool.localDolt.db.end();
      pools.delete(key);
    }));
    initialized = false;
  };

  return { initialize, add, getSys, get, close };
};
const poolManager = createPoolManager();

export const initializePools = poolManager.initialize;
export const addDb = poolManager.add;
export const getSysDb = poolManager.getSys;
export const getDb = poolManager.get;
export const closePools = poolManager.close;
