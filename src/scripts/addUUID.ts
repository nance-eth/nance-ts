import { DoltSQL } from '../dolt/doltSQL';
import { Payouts } from '../dolt/schema';
import { uuid } from '../utils';

const table = 'payouts';

async function main() {
  const dolt = new DoltSQL({ database: 'juicebox' });
  const rows = await dolt.query(`SELECT * from ${table}`) as unknown as Payouts[];
  rows.forEach((row) => {
    if (!row.uuid) {
      dolt.query(`UPDATE ${table} SET uuid = '${uuid()}' WHERE uuidOfProposal = '${row.uuidOfProposal}'`);
    }
  });
}

main();