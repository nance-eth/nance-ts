import { juiceboxTime } from '../juicebox';

async function main() {
  const projectId = '488';
  const juiceboxBasedTime = await juiceboxTime(projectId);
  console.log(juiceboxBasedTime);
}

main();
