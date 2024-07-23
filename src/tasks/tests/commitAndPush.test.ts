import { sleep } from "../../utils";
import { commitAndPush } from "../commitAndPush";

async function main() {
  await sleep(2000);
  await commitAndPush('waterbox');
}

main();
