import { init, shutdown } from "@/api/index";
import { sleep } from "@/utils";
import { closePools } from "@/dolt/pools";

beforeAll(async () => {
  await init();
  await sleep(1000);
}, 10000);

afterAll(async () => {
  await shutdown();
  await closePools();
});
