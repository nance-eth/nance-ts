import { shutdown } from "./index.mock";
import { closePools } from "@/dolt/pools";

export default async function teardown() {
  await shutdown();
  await closePools();
}
