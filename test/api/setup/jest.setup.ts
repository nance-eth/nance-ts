import "tsconfig-paths/register";
import { init } from "./index.mock";
import { sleep } from "@/utils";

export default async function setup() {
  console.log("Jest setup...");
  await init();
  await sleep(1000);
}
