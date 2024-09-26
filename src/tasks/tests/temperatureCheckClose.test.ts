import { sleep } from "../../utils";
import { getSpaceConfig } from "../../api/helpers/getSpace";
import { temperatureCheckClose } from "../temperatureCheckClose";

const space = 'moondao';

async function main() {
  await sleep(1000);
  const { config } = await getSpaceConfig(space);
  await temperatureCheckClose(space, config);
}

main();
